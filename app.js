document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('tx-form');
    const ledgerBody = document.getElementById('ledger-body');
    const checkingBalanceEl = document.getElementById('checking-balance');
    const creditBalanceEl = document.getElementById('credit-balance');
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');

    let transactions = JSON.parse(localStorage.getItem('ledger_data')) || [];

    function updateDashboard() {
        let checking = 0;
        let credit = 0;

        transactions.forEach(tx => {
            const amount = tx.type === 'income' ? parseFloat(tx.amount) : -parseFloat(tx.amount);
            if (tx.account === 'checking') checking += amount;
            if (tx.account === 'credit') credit += amount;
        });

        checkingBalanceEl.textContent = `$${checking.toFixed(2)}`;
        creditBalanceEl.textContent = `$${credit.toFixed(2)}`;
        renderTable();
    }

    function renderTable() {
        ledgerBody.innerHTML = '';
        const sortedTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedTx.forEach(tx => {
            const tr = document.createElement('tr');
            const amountClass = tx.type === 'income' ? 'income' : 'expense';
            const sign = tx.type === 'income' ? '+' : '-';
            
            tr.innerHTML = `
                <td>${tx.date}</td>
                <td>${tx.description}</td>
                <td>${tx.account}</td>
                <td class="${amountClass}">${sign}$${parseFloat(tx.amount).toFixed(2)}</td>
            `;
            ledgerBody.appendChild(tr);
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newTx = {
            id: Date.now(),
            date: document.getElementById('date').value,
            type: document.getElementById('type').value,
            account: document.getElementById('account').value,
            description: document.getElementById('description').value,
            amount: document.getElementById('amount').value
        };

        transactions.push(newTx);
        localStorage.setItem('ledger_data', JSON.stringify(transactions));
        
        form.reset();
        updateDashboard();
    });

    exportBtn.addEventListener('click', () => {
        if (transactions.length === 0) {
            alert("No data to export.");
            return;
        }
        
        let csvContent = "data:text/csv;charset=utf-8,ID,Date,Type,Account,Description,Amount\n";
        transactions.forEach(tx => {
            let row = `${tx.id},${tx.date},${tx.type},${tx.account},"${tx.description}",${tx.amount}`;
            csvContent += row + "\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ledger_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            const rows = text.split('\n').slice(1);
            let newTransactions = [];
            
            rows.forEach(row => {
                if (row.trim() === '') return;
                const cols = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (cols && cols.length >= 6) {
                   newTransactions.push({
                       id: cols[0],
                       date: cols[1],
                       type: cols[2],
                       account: cols[3],
                       description: cols[4].replace(/(^"|"$)/g, ''),
                       amount: cols[5]
                   });
                }
            });
            
            if (newTransactions.length > 0) {
                const existingIds = new Set(transactions.map(t => String(t.id)));
                const imports = newTransactions.filter(t => !existingIds.has(String(t.id)));
                transactions = [...transactions, ...imports];
                localStorage.setItem('ledger_data', JSON.stringify(transactions));
                updateDashboard();
                alert(`${imports.length} new transactions loaded successfully.`);
            }
        };
        reader.readAsText(file);
        importFile.value = '';
    });

    updateDashboard();
});
