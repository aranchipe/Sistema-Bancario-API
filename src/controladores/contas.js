let bancoDeDados = require('../bancodedados')
let identificador = 1
const { format } = require('date-fns')
const { depositos } = require('../bancodedados')


const listarContas = (req, res) => {
    const { senha_banco } = req.query

    if (!senha_banco) {
        return res.status(403).json({ "mensagem": "Por favor, insira a senha do banco" })
    }
    if (senha_banco !== bancoDeDados.banco.senha) {
        return res.status(403).json({ "mensagem": "A senha está incorreta" })
    }
    return res.status(200).json(bancoDeDados.contas)
}

const addConta = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ "mensagem": "Todos os campos são obrigatórios" })
    }

    const cpfEncontrado = bancoDeDados.contas.find((item) => {
        return item.usuario.cpf === cpf
    })
    const emailEncontrado = bancoDeDados.contas.find(item => {
        return item.usuario.email === email
    })

    if (cpfEncontrado || emailEncontrado) {
        return res.status(400).json({ "mensagem": "Já existe uma conta com o cpf ou e-mail informado!" })
    }

    const novaConta = {
        numero: identificador++,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    }

    bancoDeDados.contas.push(novaConta)
    return res.status(201).json()
}

const attUsuario = (req, res) => {
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body
    const { numeroConta } = req.params

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ "mensagem": "Todos os campos são obrigatórios" })
    }

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numeroConta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    const outrasContas = bancoDeDados.contas.filter(item => {
        return item.numero !== Number(numeroConta)
    })


    const cpfEncontrado = outrasContas.find(item => {
        return item.usuario.cpf === cpf
    })

    const emailEncontrado = outrasContas.find(item => {
        return item.usuario.email === email
    })

    if (cpfEncontrado || emailEncontrado) {
        return res.status(400).json({ "mensagem": "O CPF ou o email informado já existe cadastrado!" })
    }

    contaEncontrada.usuario = {
        nome,
        cpf,
        data_nascimento,
        telefone,
        email,
        senha
    }
    return res.status(200).json()
}

const excluirConta = (req, res) => {
    const { numeroConta } = req.params

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numeroConta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (contaEncontrada.saldo !== 0) {
        return res.status(400).json({ "mensagem": "O saldo da conta a ser excluída deve ser 0" })
    }

    const outrasContas = bancoDeDados.contas.filter(item => {
        return item.numero !== Number(numeroConta)
    })

    bancoDeDados.contas = outrasContas

    return res.status(200).json()
}

const depositar = (req, res) => {

    const data = format(new Date(), "yyyy-MM-dd")
    const horario = format(new Date(), "kk:mm:ss")

    const { numero_conta, valor } = req.body

    if (!numero_conta) {
        return res.status(400).json({ "mensagem": "Digite o número da conta" })
    }

    if (!valor) {
        return res.status(400).json({ "mensagem": "Digite o valor a ser depositado" })
    }

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (valor <= 0) {
        return res.status(400).json({ "mensagem": "O valor depositado deve ser positivo" })
    }

    contaEncontrada.saldo = contaEncontrada.saldo + valor

    bancoDeDados.depositos.push({
        "data": `${data} ${horario}`,
        "numero_conta": numero_conta,
        "valor": valor
    })

    return res.status(200).json({
        "data": `${data} ${horario}`,
        "numero_conta": numero_conta,
        "valor": valor
    })
}

const sacar = (req, res) => {
    const data = format(new Date(), "yyyy-MM-dd")
    const horario = format(new Date(), "kk:mm:ss")

    const { numero_conta, valor, senha } = req.body

    if (!numero_conta) {
        return res.status(400).json({ "mensagem": "Digite o número da conta" })
    }

    if (!valor) {
        return res.status(400).json({ "mensagem": "Digite o valor a ser depositado" })
    }

    if (!senha) {
        return res.status(400).json({ "mensagem": "Digite a senha" })
    }

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (senha !== contaEncontrada.usuario.senha) {
        return res.status(403).json({ "mensagem": "A senha está incorreta" })
    }

    if (contaEncontrada.saldo < valor) {
        return res.status(404).json({ "mensagem": "O saldo não é suficiente" })
    }

    contaEncontrada.saldo = contaEncontrada.saldo - valor

    bancoDeDados.saques.push({
        "data": `${data} ${horario}`,
        "numero_conta": numero_conta,
        "valor": valor
    })
    return res.status(200).json()

}

const transferir = (req, res) => {
    const data = format(new Date(), "yyyy-MM-dd")
    const horario = format(new Date(), "kk:mm:ss")
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body

    if (!numero_conta_origem) {
        return res.status(400).json({ "mensagem": "Digite o número da conta de origem" })
    }

    if (!numero_conta_destino) {
        return res.status(400).json({ "mensagem": "Digite o número da conta destino" })
    }

    if (!valor) {
        return res.status(400).json({ "mensagem": "Digite o valor a ser depositado" })
    }

    if (!senha) {
        return res.status(400).json({ "mensagem": "Digite a senha" })
    }

    const contaOrigemEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta_origem)
    })

    if (!contaOrigemEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    const contaDestinoEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta_destino)
    })

    if (!contaDestinoEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (senha !== contaOrigemEncontrada.usuario.senha) {
        return res.status(403).json({ "mensagem": "A senha está incorreta" })
    }

    if (contaOrigemEncontrada.saldo < valor) {
        return res.status(404).json({ "mensagem": "O saldo não é suficiente" })
    }

    contaOrigemEncontrada.saldo = contaOrigemEncontrada.saldo - valor
    contaDestinoEncontrada.saldo = contaDestinoEncontrada.saldo + valor

    bancoDeDados.transferencias.push({
        "data": `${data} ${horario}`,
        "numero_conta_origem": numero_conta_origem,
        "numero_conta_destino": numero_conta_destino,
        "valor": valor
    })

    return res.status(200).json()
}

const saldo = (req, res) => {
    const { numero_conta, senha } = req.query

    if (!numero_conta) {
        return res.status(400).json({ "mensagem": "Digite o número da conta" })
    }

    if (!senha) {
        return res.status(400).json({ "mensagem": "Digite a senha" })
    }

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (senha !== contaEncontrada.usuario.senha) {
        return res.status(403).json({ "mensagem": "A senha está incorreta" })
    }

    return res.status(200).json({ "saldo": contaEncontrada.saldo })
}

const extrato = (req, res) => {
    const { numero_conta, senha } = req.query

    if (!numero_conta) {
        return res.status(400).json({ "mensagem": "Digite o número da conta" })
    }

    if (!senha) {
        return res.status(400).json({ "mensagem": "Digite a senha" })
    }

    const contaEncontrada = bancoDeDados.contas.find(item => {
        return item.numero === Number(numero_conta)
    })

    if (!contaEncontrada) {
        return res.status(404).json({ "mensagem": "Digite um número de conta válido" })
    }

    if (senha !== contaEncontrada.usuario.senha) {
        return res.status(403).json({ "mensagem": "A senha está incorreta" })
    }

    const depositosEncontrados = bancoDeDados.depositos.filter(item => {
        return item.numero_conta === numero_conta
    })

    const saquesEncontrados = bancoDeDados.saques.filter(item => {
        return item.numero_conta === numero_conta
    })

    const transferenciasEnviadasEncontradas = bancoDeDados.transferencias.filter(item => {
        return item.numero_conta_origem === numero_conta
    })

    const transferenciasRecebidasEncontradas = bancoDeDados.transferencias.filter(item => {
        return item.numero_conta_destino === numero_conta
    })

    return res.status(200).json({

        "depositos": depositosEncontrados,
        "saques": saquesEncontrados,
        "transferenciasEnviadas": transferenciasEnviadasEncontradas,
        "transferenciasRecebidas": transferenciasRecebidasEncontradas
    })
}

module.exports = {
    listarContas,
    addConta,
    attUsuario,
    excluirConta,
    depositar,
    sacar,
    transferir,
    saldo,
    extrato
}