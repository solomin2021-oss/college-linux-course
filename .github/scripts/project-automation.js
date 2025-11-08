const automateProjectBoard = async ({ github, context }) => {
  // Конфигурация
  const PROJECT_NUMBER = 4;
  const OWNER = 'virusneo1997-del'; // Ваш username
  const IS_ORGANIZATION = false; // false если это пользовательский проект

  console.log('🚀 Запуск автоматизации Project Board...');
  console.log(`Событие: ${context.eventName}, Действие: ${context.payload.action}`);
  console.log(`Автор PR: ${context.payload.pull_request?.user?.login}`);

  try {
    // 1. Получаем ID проекта
    const projectId = await getProjectId(github, OWNER, PROJECT_NUMBER, IS_ORGANIZATION);
    if (!projectId) {
      console.log('❌ Проект не найден');
      return;
    }

    // 2. Получаем информацию о поле Status
    const statusField = await getStatusField(github, projectId);
    if (!statusField) {
      console.log('❌ Поле Status не найдено');
      return;
    }

    // 3. Определяем автора PR
    const author = context.payload.pull_request?.user?.login;
    if (!author) {
      console.log('❌ Не удалось определить автора PR');
      return;
    }

    // 4. Находим карточку студента
    const studentCard = await findStudentCard(github, projectId, author);
    if (!studentCard) {
      console.log(`❌ Карточка для студента ${author} не найдена`);
      return;
    }

    // 5. Определяем новый статус на основе события
    const newStatus = determineNewStatus(context);
    if (!newStatus) {
      console.log('❌ Не удалось определить новый статус');
      return;
    }

    // 6. Находим ID опции статуса
    const statusOptionId = findStatusOptionId(statusField, newStatus);
    if (!statusOptionId) {
      console.log(`❌ Опция статуса "${newStatus}" не найдена`);
      return;
    }

    // 7. Обновляем статус карточки
    await updateCardStatus(github, projectId, studentCard.id, statusField.id, statusOptionId);
    
    console.log(`✅ Карточка студента ${author} перемещена в статус: ${newStatus}`);

  } catch (error) {
    console.error('💥 Ошибка автоматизации:', error);
  }
};

// Обновленная функция получения ID проекта
async function getProjectId(github, owner, projectNumber, isOrganization = false) {
  const entityType = isOrganization ? 'organization' : 'user';
  
  const query = `
    query {
      ${entityType}(login: "${owner}") {
        projectV2(number: ${projectNumber}) {
          id
          title
        }
      }
    }
  `;
  
  const result = await github.graphql(query);
  return result[entityType]?.projectV2?.id;
}

// Остальные функции остаются без изменений
async function getStatusField(github, projectId) {
  const query = `
    query {
      node(id: "${projectId}") {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const result = await github.graphql(query);
  const fields = result.node.fields.nodes;
  return fields.find(field => field.name === 'Status');
}

async function findStudentCard(github, projectId, studentGitHub) {
  const query = `
    query {
      node(id: "${projectId}") {
        ... on ProjectV2 {
          items(first: 50) {
            nodes {
              id
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                    text
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const result = await github.graphql(query);
  const items = result.node.items.nodes;
  
  return items.find(item => {
    const githubField = item.fieldValues.nodes.find(f => 
      f.field?.name === 'Student GitHub'
    );
    return githubField && githubField.text === studentGitHub;
  });
}

function determineNewStatus(context) {
  const event = context.eventName;
  const action = context.payload.action;
  const reviewState = context.payload.review?.state;

  if (event === 'pull_request') {
    switch (action) {
      case 'opened':
      case 'reopened':
        return 'In Progress';
      case 'ready_for_review':
        return 'In Review';
      case 'closed':
        return context.payload.pull_request.merged ? 'Done' : 'To do';
    }
  }

  if (event === 'pull_request_review' && reviewState === 'approved') {
    return 'Done';
  }

  return null;
}

function findStatusOptionId(statusField, statusName) {
  const option = statusField.options.find(opt => opt.name === statusName);
  return option?.id;
}

async function updateCardStatus(github, projectId, itemId, fieldId, optionId) {
  const mutation = `
    mutation {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: "${projectId}"
          itemId: "${itemId}"
          fieldId: "${fieldId}"
          value: {
            singleSelectOptionId: "${optionId}"
          }
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `;
  
  await github.graphql(mutation);
}

module.exports = { automateProjectBoard };
