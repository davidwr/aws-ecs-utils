require('dotenv').config()

const AWS = require('aws-sdk')

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

const ecs = new AWS.ECS()
const ec2 = new AWS.EC2()

async function main() {
  const { taskArns } = await ecs.listTasks({
    cluster: process.env.ECS_CLUSTER,
    family: process.env.ECS_TASK_FAMILY,
    desiredStatus: 'RUNNING'
  }).promise()

  const TasksIds = taskArns.map((task) => {
    return task.replace(process.env.ECS_CLUSTER_ARN, '')
  })

  const { tasks } = await ecs.describeTasks({
    tasks: TasksIds,
    cluster: process.env.ECS_CLUSTER
  }).promise()

  for (let i = 0; i < tasks.length; i++) {    
    const containerArn = tasks[i].containerInstanceArn
    const containerIntanceId = containerArn.substring(containerArn.indexOf('/') + 1)

    const container = await ecs.describeContainerInstances({
      containerInstances: [containerIntanceId],
      cluster: process.env.ECS_CLUSTER
    }).promise()
    
    const ec2Id = container.containerInstances[0].ec2InstanceId
    
    const ec2Instance = await ec2.describeInstances({
      InstanceIds: [ec2Id]
    }).promise()
    
    const host = ec2Instance.Reservations[0].Instances[0].PrivateIpAddress
    const port = tasks[i].containers[0].networkBindings[0].hostPort
    console.log(`${host}:${port}`)
  }
}

main()