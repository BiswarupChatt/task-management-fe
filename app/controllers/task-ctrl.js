const { validationResult } = require('express-validator')
const Task = require("../models/task-model")
const User = require("../models/user-model")
const nodemailer = require("../utility/nodemailer")
// const Employee = require("../models/task-model");
const taskCtrl = {};

//creating the tasks
taskCtrl.create = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const body = req.body
    const task = new Task(body)
    task.userId = req.user.id
    await task.save()
    const assignedUser = await User.findById(task.assignedUserId)
    if (!assignedUser) {
      return res.status(400).json({ errors: 'Assigned user not found' })
    } else {
      nodemailer.sendTaskEmail(assignedUser.email)
    }
    res.status(200).json(task)
  } catch (err) {
    res.status(500).json({ errors: 'Something went wrong' })
  }
}

taskCtrl.getTasks = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    if (req.user.role == 'Employee') {
      const userId = req.user.id
      const tasks = await Task.find({ assignedUserId: userId });
      res.status(200).json(tasks)
    } else {
      const userId = req.user.id;
      const tasks = await Task.find({ userId: userId }); // userId is case sensitive 
      res.status(200).json(tasks);
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ errors: 'Cant not retrieve the data ' })
  }

};

// taskCtrl.getTeamLeadTasks = async (req, res) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }

//   try {
//     const userId = req.user.id;
//     const tasks = await Task.find({ userId: userId }); // userId is case sensitive 
//     res.status(200).json(tasks);
//   } catch (err) {
//     console.error('Error retrieving tasks:', err);
//     res.status(500).json({ errors: 'Cannot retrieve the data' });
//   }
// };


taskCtrl.update = async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.send(task);
};

taskCtrl.delete = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const taskId = req.query._id
    const userId = req.user.id
    const task = await Task.findById(taskId)

    if (task.userId.toString() !== userId.toString()) {
      res.status(400).json({ errors: "Unauthorized to delete task" })
    } else {
      const deletedTask = await Task.findByIdAndDelete(taskId)
      res.status(200).json(deletedTask)
    }


  } catch (err) {
    console.log(err)
    res.status(500).json({ errors: "Something went wrong" })
  }
};

module.exports = taskCtrl;
