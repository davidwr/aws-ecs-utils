require('dotenv').config()

const AWS = require('aws-sdk')
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})
const ecs = new AWS.ECS()

async function main() {
  const { taskArns } = await ecs.listTasks({
    cluster: process.env.ECS_CLUSTER,
    family: process.env.ECS_TASK_FAMILY,
    desiredStatus: 'STOPPED'
  }).promise()

  const TasksIds = taskArns.map((task) => {
    return task.replace(process.env.ECS_CLUSTER_ARN, '')
  })

  const { tasks } = await ecs.describeTasks({
    tasks: TasksIds,
    cluster: process.env.ECS_CLUSTER
  }).promise()

  const tasksOrdered = tasks.sort((a, b) => {
    return (new Date(a.stoppedAt) > new Date(b.stoppedAt))
  })

  for (let i = 0; i < tasksOrdered.length; i++) {
    console.log(`${tasksOrdered[i].stoppedAt} - ${tasksOrdered[i].stoppedReason}`)    
  }
}

main()