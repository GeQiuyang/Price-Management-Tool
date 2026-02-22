import express from 'express'
import { body } from 'express-validator'
import * as authController from '../controllers/auth.js'
import { authenticate, authLimiter } from '../middleware/auth.js'
import { apiLimiter, validate } from '../middleware/security.js'

const router = express.Router()

router.post('/register', 
  authLimiter,
  validate({
    username: [
      body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度必须在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线')
    ],
    email: [
      body('email')
        .trim()
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
    ],
    password: [
      body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少为6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字')
    ],
    full_name: [
      body('full_name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('姓名长度不能超过100个字符')
    ],
    phone: [
      body('phone')
        .optional()
        .trim()
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('请输入有效的手机号码')
    ]
  }),
  authController.register
)

router.post('/login',
  authLimiter,
  validate({
    username: [
      body('username')
        .trim()
        .notEmpty()
        .withMessage('用户名不能为空')
    ],
    password: [
      body('password')
        .notEmpty()
        .withMessage('密码不能为空')
    ]
  }),
  authController.login
)

router.post('/logout',
  authenticate,
  authController.logout
)

router.post('/refresh',
  apiLimiter,
  validate({
    refreshToken: [
      body('refreshToken')
        .notEmpty()
        .withMessage('刷新令牌不能为空')
    ]
  }),
  authController.refresh
)

router.get('/me',
  authenticate,
  authController.getMe
)

router.post('/change-password',
  authenticate,
  validate({
    oldPassword: [
      body('oldPassword')
        .notEmpty()
        .withMessage('原密码不能为空')
    ],
    newPassword: [
      body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少为6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('新密码必须包含大小写字母和数字')
    ]
  }),
  authController.changePassword
)

router.post('/forgot-password',
  apiLimiter,
  validate({
    email: [
      body('email')
        .trim()
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail()
    ]
  }),
  authController.forgotPassword
)

router.post('/reset-password',
  apiLimiter,
  validate({
    token: [
      body('token')
        .notEmpty()
        .withMessage('重置令牌不能为空')
    ],
    newPassword: [
      body('newPassword')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少为6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('新密码必须包含大小写字母和数字')
    ]
  }),
  authController.resetPassword
)

export default router
