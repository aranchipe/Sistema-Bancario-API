const express = require('express')
const { listarContas, addConta, attUsuario, excluirConta, depositar, sacar, transferir, saldo, extrato } = require('./controladores/contas')
const rotas = express()
const { format } = require('date-fns')


rotas.get('/contas', listarContas)
rotas.post('/contas', addConta)
rotas.put('/contas/:numeroConta/usuario', attUsuario)
rotas.delete('/contas/:numeroConta', excluirConta)
rotas.post('/transacoes/depositar', depositar)
rotas.post('/transacoes/sacar', sacar)
rotas.post('/transacoes/transferir', transferir)
rotas.get('/contas/saldo', saldo)
rotas.get('/contas/extrato', extrato)







module.exports = rotas 
