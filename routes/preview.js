var express = require('express')
var router = express.Router()
let logger = oboRequire('logger')
let { createPreviewVisit } = require('./create-visit')
let db = oboRequire('db')

router.get('/:draftId', (req, res, next) => {
	return req
		.requireCurrentUser()
		.then(currentUser => {
			return createPreviewVisit(currentUser.id, req.params.draftId)
		})
		.then(visit => {
			return new Promise((resolve, reject) => {
				req.session.save(function(err) {
					if (err) return reject(err)

					resolve(visit)
				})
			})
		})
		.then(visit => {
			res.redirect(`/view/${req.params.draftId}/visit/${visit.id}`)
		})
		.catch(error => {
			logger.error(error)
			next(error)
		})
})

module.exports = router
