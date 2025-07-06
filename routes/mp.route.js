const express = require('express');
const router = express.Router();
const mpCtrl = require('../controllers/mp.controller');
const authCtrl = require('../controllers/auth-controller');


router.post('/buy-ticket', authCtrl.verifyToken, mpCtrl.buyTicket);
router.post('/buy-cart',authCtrl.verifyToken, mpCtrl.buyCart);
router.post('/receive-webhook', mpCtrl.receiveWebhook);

module.exports = router;