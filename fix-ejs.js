const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'views', 'admin');
let changedCount = 0;

fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.ejs')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // The pattern we want to replace is exactly:
        // <%= typeof csrfToken !== \'undefined\' ? csrfToken : \'\' %>
        // and we want to replace it with:
        // <%= typeof csrfToken !== 'undefined' ? csrfToken : '' %>

        // Because the backslashes are literal in the file, we can just replace them.
        const wrongSyntax = "<%= typeof csrfToken !== \\'undefined\\' ? csrfToken : \\'\\' %>";
        const rightSyntax = "<%= typeof csrfToken !== 'undefined' ? csrfToken : '' %>";

        if (content.includes(wrongSyntax)) {
            content = content.split(wrongSyntax).join(rightSyntax);
            fs.writeFileSync(filePath, content);
            console.log('Fixed', file);
            changedCount++;
        }
    }
});

console.log(`Fixed ${changedCount} files.`);
