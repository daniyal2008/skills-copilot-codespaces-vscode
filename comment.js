// create new web server
const express = require('express')
const router = express.Router()

// import model
const Comment = require('../models/comment')

// import middleware
const { authenticated } = require('../config/auth')

// import handlebars helper
const { formatDate } = require('../config/handlebars-helpers')

// import route
const restController = require('../controllers/restController')

// import multer
const multer = require('multer')
const upload = multer({ dest: 'temp/' })

// import imgur
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID

// get all comments
router.get('/', authenticated, restController.getComments)

// create comment
router.post('/', authenticated, upload.single('image'), (req, res) => {
  if (!req.body.text) {
    req.flash('error_messages', '請輸入留言內容')
    return res.redirect('back')
  }
  const { file } = req
  if (file) {
    imgur.setClientID(IMGUR_CLIENT_ID)
    imgur.upload(file.path, (err, img) => {
      Comment.create({
        text: req.body.text,
        UserId: req.user.id,
        RestaurantId: req.body.restaurantId,
        image: file ? img.data.link : null
      }).then(() => {
        req.flash('success_messages', '留言成功')
        res.redirect(`/restaurants/${req.body.restaurantId}`)
      })
    })
  } else {
    Comment.create({
      text: req.body.text,
      UserId: req.user.id,
      RestaurantId: req.body.restaurantId
    }).then(() => {
      req.flash('success_messages', '留言成功')
      res.redirect(`/restaurants/${req.body.restaurantId}`)
    })
  }
})

// delete comment
router.delete('/:id', authenticated, (req, res) => {
  Comment.findByPk(req.params.id)
    .then(comment => {
      comment.destroy()
        .then(() => {
          req.flash('success_messages', '留言已刪除')
          res.redirect(`/restaurants/${comment.RestaurantId}`)
        })
    })
})

module.exports = router