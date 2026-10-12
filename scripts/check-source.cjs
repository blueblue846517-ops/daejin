const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(file);
        else if (entry.name.endsWith('.js')) files.push(file);
    }
}
walk(path.join(root,'assets/js')); walk(path.join(root,'api')); walk(path.join(root,'assets/vendor'));
for (const file of files) new vm.Script(fs.readFileSync(file,'utf8'), {filename:file});
for (const page of ['index.html','admin.html','about.html','thanks.html']) {
    const html = fs.readFileSync(path.join(root,page),'utf8');
    for (const match of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)(?:[?#][^"]*)?"/g)) {
        if (!fs.existsSync(path.join(root,match[1]))) throw new Error(`${page}: missing ${match[1]}`);
    }
}
console.log(`PASS: ${files.length} JavaScript files parsed; local asset references exist on 4 pages. Static site: no framework build required.`);
