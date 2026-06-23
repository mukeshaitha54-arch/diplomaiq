import pdfplumber
import json
import os

pdf_path = "ecet-2025.pdf"

with pdfplumber.open(pdf_path) as pdf:
    # Look at all 5 pages
    all_text = ""
    for i, page in enumerate(pdf.pages):
        all_text += f"\n--- PAGE {i} ---\n"
        all_text += page.extract_text()

with open("pdf_preview_all.txt", "w", encoding='utf-8') as f:
    f.write(all_text)

print("Saved full text preview to pdf_preview_all.txt")
