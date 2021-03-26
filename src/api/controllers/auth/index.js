var authService = require('../../../services/auth');

exports.signUp = function(req, res){
    const {email, password} = req.body;

    return await authService.signUp(email, password);
}

exports.signIn = function(req, res){
    const {email, password} = req.body;

    return await authService.signIn(email, password);
 }


 exports.verify = function(req, res){
    const {email, code} = req.body;

    return await authService.verify(email, code);
 }