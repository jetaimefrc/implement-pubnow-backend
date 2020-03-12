import { UNAUTHORIZED, INTERNAL_SERVER_ERROR, NOT_FOUND, FORBIDDEN } from 'http-status-codes'
import { User } from '@models'
import { verify } from 'jsonwebtoken'
import accessEnv from '@helpers/accessEnv'
import {
  INVALID_TOKEN,
  EXPIRED_TOKEN,
  SOMETHING_WRONG,
  USER_NOT_FOUND,
  INSUFFICIENT_PERMISSION,
} from '@constants/errorsMessage'
import { generalErrors } from '@helpers/errorHandlers'

const JWT_SECRET = accessEnv('JWT_SECRET')

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const checkTokenSetUser = async (req, res, next) => {
  const authToken = req.get('Authorization').split(' ')[1]
  if (authToken) {
    const payload = await verify(authToken, JWT_SECRET)
    return User.validateUserToken(payload)
      .then(user => {
        // If no user in the payload exists, respond back with a 401
        if (!user) {
          return generalErrors(res, NOT_FOUND, USER_NOT_FOUND)
        }
        // Authenticate user and PASS it to next middleware
        req.user = user
        next()
      })
      .catch(err => {
        if (err.name === EXPIRED_TOKEN) {
          return generalErrors(res, UNAUTHORIZED, EXPIRED_TOKEN)
        } else if (err.name === 'JsonWebTokenError') {
          return generalErrors(res, UNAUTHORIZED, INVALID_TOKEN)
        } else {
          return generalErrors(res, INTERNAL_SERVER_ERROR, SOMETHING_WRONG)
        }
      })
  } else {
    return generalErrors(res, UNAUTHORIZED, INVALID_TOKEN)
  }
}

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const isAdmind = (req, res, next) => {
  if (req.user.role === 'ADMIN') return next()
  return generalErrors(res, FORBIDDEN, INSUFFICIENT_PERMISSION)
}
