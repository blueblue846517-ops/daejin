
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('./index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously' });

// We can't easily mock Supabase network requests in JSDOM without a lot of setup.
// Let's just check if there's any obvious syntax error in supabase_init.js.
try {
    const code = fs.readFileSync('./assets/js/supabase_init.js', 'utf8');
    // Check syntax
    new Function(code);
    console.log('No syntax errors in supabase_init.js');
} catch(e) {
    console.error('Syntax error:', e);
}

