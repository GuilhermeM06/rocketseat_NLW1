const modalAddTransaction = {
    open() {
        document.querySelector('.modal-overlay').classList.add('active')
    },
    close() {
        document.querySelector('.modal-overlay').classList.remove('active')
    }

}

const modalEditTransaction = {
    open() {
        document.querySelector('.modal-overlay.editor').classList.add('active')
    },
    close() {
        document.querySelector('.modal-overlay.editor').classList.remove('active')
    }
}




const Storage = {
    get(){
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },
    set(transactions){
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction){
        Transaction.all.push(transaction)

        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()

    },

    incomes() {
        let income = 0
        Transaction.all.forEach((transaction) => {
            if( transaction.amount > 0) {
                income += transaction.amount;
            }
        })
        return income;
    },
    expenses() {
        let expense = 0
        Transaction.all.forEach((transaction) => {
            if( transaction.amount < 0) {
                expense += transaction.amount;
            }
        })
        return expense;
    },
    total() {
        return Transaction.incomes() + Transaction.expenses()
    },

}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index


        DOM.transactionsContainer.appendChild(tr)
    },

    innerHTMLTransaction(transaction, index) {
        const CSSclass = transaction.amount > 0 ? "income" : "expense"

        const amount = Utils.formatCurrency(transaction.amount);

        const html = `
        <tr>
            <td class="description">${transaction.description}</td>
            <td class="${CSSclass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td class="img-buttons">
                <p id="editor" onclick="Edit.saveIndex(${index}), Edit.setValues(${index}), modalEditTransaction.open()">Editar</p>
                <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="remover transação">
            </td>
        </tr>
        `

        return html
    },

    updateBalance() {
        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes()) 

        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())

        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
    },

    clearTransactions(){
        DOM.transactionsContainer.innerHTML = ""
    }
}

const Utils = {
    formatAmount(value){
        value = Number(value) * 100
        return Math.round(value)
    },

    formatDate(date){
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""

        value = String(value).replace(/\D/g, "")
        value = Number(value) / 100

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    setCurrentDate(){
        const currentDate =  new Date();
        const year = currentDate.getFullYear()
        let month = currentDate.getMonth() + 1
        if(month < 10){
            month = "0" + String(month)
        }
        const day = currentDate.getDate()
        if(day < 10){
            day = "0" + String(month)
        }
        Form.date.value = year + "-" + month + "-" + day;

    },
    

    getValues() {
        return{
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    validateFields(){
        const { description, amount, date } = Form.getValues()
        if (description.trim() === "" || 
            amount.trim() === "" || 
            date.trim() === ""){
                throw new Error("Por favor preencha todos os campos")
        }
        const check = date.split('-')
        const year = Number(check[0])
        if(year < 1900){
            throw new Error("O ano só é valido a partir de 1900.")
        }
    },

    formatValues(){
        let { description, amount, date } = Form.getValues()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },
    
    clearFields(){
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    },

    submit(event){
        event.preventDefault()

        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            Transaction.add(transaction)
            Form.clearFields()
            modalAddTransaction.close()
        } catch (error) {
            
            alert(error.message)
        }
    
        Form.formatValues()
    }
}

const Filter = {

    filterIncomes(){
        DOM.clearTransactions()
        Transaction.all.forEach((transaction) => {
            if(transaction.amount > 0){
                let index = Transaction.all.indexOf(transaction)
                DOM.addTransaction(transaction, index)
            }
        })
        
    },

    filterExpenses(){
        DOM.clearTransactions()
        Transaction.all.forEach((transaction) => {
            if(transaction.amount < 0){
                let index = Transaction.all.indexOf(transaction)
                DOM.addTransaction(transaction, index)
            }
        })
        
    },
    filterTotal(){
        App.reload()
    },
   

    searchBarDescriptions(){
        let FilterValue, input, description;
        DOM.clearTransactions()
        input = document.getElementById('filter-search')
        FilterValue = input.value.toUpperCase()
        Transaction.all.forEach((transaction) => {
            description = transaction.description.toUpperCase()
            if(description.indexOf(FilterValue) > -1){
                let index = Transaction.all.indexOf(transaction)
                DOM.addTransaction(transaction, index)
            }
        })
   
    },

    filterDate(){
        DOM.clearTransactions()
        Transaction.all.sort((a, b) => {
            const dateA = a.date.split("/");
            const dateB = b.date.split("/");
            const formatDateA = dateA[2] + "-" + dateA[1] + "-" + dateA[0];
            const formatDateB = dateB[2] + "-" + dateB[1] + "-" + dateB[0];
            const formatedDateA = new Date(formatDateA);
            const formatedDateB = new Date(formatDateB);
            return formatedDateB - formatedDateA
        })
        Transaction.all.forEach((transaction) => {
            let index = Transaction.all.indexOf(transaction)
            DOM.addTransaction(transaction, index)
        })
        
    }
}


const Edit = {
    index:0,
    description: document.querySelector('input#descricao2'),
    amount: document.querySelector('input#amount2'),
    date: document.querySelector('input#date2'),
    
    saveIndex(index){
        Edit.index = index
    },
    
    formatDateReturn(date){
        const splittedDate = date.split("/")
        return `${splittedDate[2]}-${splittedDate[1]}-${splittedDate[0]}`
    },



    setValues(index){
        let transaction = Transaction.all[index]
        let date = Edit.formatDateReturn(transaction.date)
        Edit.description.value = transaction.description
        Edit.amount.value = transaction.amount/100
        Edit.date.value = date
        

    },


    getValues(){
        return{
            description: Edit.description.value,
            amount: Edit.amount.value,
            date: Edit.date.value
        }
    },

    validateDateField(){

        const values = Edit.getValues()
        const splittedDate = values.date.split('-')
        const year = Number(splittedDate[0])
        if(year < 1900){
            throw new Error("O ano só é valido a partir de 1900.")
        }
         
    },

    formatValues(){
        let { description, amount, date } = Edit.getValues()
        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },

    editTransaction(index){
        let transaction = Edit.formatValues()
        Transaction.all[index].description = transaction.description
        Transaction.all[index].amount = transaction.amount
        Transaction.all[index].date = transaction.date
        App.reload()

    },

    clearFields(){
        Edit.description.value = ""
        Edit.amount.value = ""
        Edit.date.value = ""
    },
    submit(event){
        event.preventDefault()
        

        try{
            Edit.validateDateField()
            let index = Edit.index
            Edit.editTransaction(index)
            Edit.clearFields()
            modalEditTransaction.close()
        } catch(error){
            alert(error.message)
        }
    
    }

}


const Total = {
    colorChangeCard(){
        let sum = Transaction.total()
        if(sum < 0){
            document.querySelector(".card.total")
            .classList.add("negative")
        }
        if(sum >= 0){
            document.querySelector(".card.total")
            .classList.remove("negative")
        }
        
    }
}

const App = {
    init() {
        Transaction.all.forEach(DOM.addTransaction)
        
        DOM.updateBalance()

        Storage.set(Transaction.all)

        Filter.filterDate()

        Total.colorChangeCard()
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    },

}

App.init()









