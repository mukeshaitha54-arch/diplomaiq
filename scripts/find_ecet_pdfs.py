import requests
from bs4 import BeautifulSoup
import urllib.parse
import os

url = "https://tgecet.nic.in/"
try:
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, verify=False)
    soup = BeautifulSoup(response.text, 'html.parser')
    links = soup.find_all('a')
    pdf_links = []
    for link in links:
        href = link.get('href')
        if href and ('last rank' in link.text.lower() or 'cutoff' in link.text.lower() or 'rank statement' in link.text.lower()):
            pdf_links.append((link.text, urllib.parse.urljoin(url, href)))
    print("Found links matching criteria:", pdf_links)
except Exception as e:
    print("Error:", e)
