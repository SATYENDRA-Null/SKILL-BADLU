import re

app_js = open('js/app.js', encoding='utf-8').read()
index_html = open('index.html', encoding='utf-8').read()

js_ids = set(re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', app_js))
html_ids = set(re.findall(r'id=[\'"]([^\'"]+)[\'"]', index_html))

missing = js_ids - html_ids
print('Missing IDs in index.html:', missing)
