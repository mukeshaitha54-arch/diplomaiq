import pdfplumber
import json
import os

pdf_path = "ecet-2025.pdf"

if not os.path.exists(pdf_path):
    print("PDF not found!")
    exit(1)

extracted_data = []

with pdfplumber.open(pdf_path) as pdf:
    # Just inspect the first page to understand structure
    page = pdf.pages[0]
    tables = page.extract_tables()
    for table in tables:
        extracted_data.append(table)
        
    text = page.extract_text()

out = {
    "text_sample": text[:500] if text else "",
    "tables": extracted_data
}

with open("pdf_preview.json", "w", encoding='utf-8') as f:
    json.dump(out, f, indent=2)

print(f"Extracted {len(extracted_data)} tables from page 1.")
