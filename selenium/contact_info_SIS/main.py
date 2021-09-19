import json
import pprint
import xlsxwriter
import time
import csv

import pprint
import sys
import pandas as pd

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver import ActionChains

import re 

import os
from dotenv import load_dotenv

load_dotenv() # read .env file

chrome_options = Options()
chrome_options.add_argument('--headless')
user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36'
chrome_options.add_argument('user-agent={0}'.format(user_agent))
driver = webdriver.Chrome('chromedriver.exe') 
action = ActionChains(driver)

df = pd.DataFrame(columns=['website','phone numbers', 'email'])

def searchRegex(page_src, url):
    global df
    pattern = re.compile(r"(\([0-9]{3}\)\s?|[0-9]{3}-)[0-9]{3}-[0-9]{4}")
    phone_num = re.search(pattern, page_src)
    new_row = {}

    if phone_num: 
        print(f'Found: {phone_num.group()} from ${url} using regex')
        
        new_row = {'website': url, 'phone numbers': phone_num.group()}
    else:
        print(f'NOT FOUND at {url} using regex')
        new_row = {'website': url, 'phone numbers': 'NOT FOUND'}
    
    return new_row

def getData(url):
    global df
    new_row = {}
    try:
        phone_num_elem = driver.find_element_by_css_selector('a[href^="tel:"]')

    except NoSuchElementException:
        print("can't find phone number using a tag")
        new_row = searchRegex(driver.page_source, url)

    else:
        phone_num = phone_num_elem.get_attribute('href') 
        new_row = {'website': url, 'phone numbers': phone_num}
   
    try: 
        email_elem = driver.find_element_by_css_selector('a[href^="mailto:"]')
    except NoSuchElementException:
        print("can't find email using a tag")
        new_row['email'] = 'NOT FOUND'
    else: 
        email = email_elem.get_attribute('href')
        print(f'Found: {new_row["phone numbers"]} & {email} from {url} using css selector')
        new_row['email'] = email

    print(f'Found: {new_row["phone numbers"]} from {url} using css selector')
    df = df.append(new_row, ignore_index=True)

def main(): 
    global df
    f = open('websites.json')
    data = json.load(f)

    websites = data['websites']
    # url = 'https://www.tractorsupply.com/tsc/store_Loveland-OH-45140_2343'
    for url in websites:
        print(url)
        driver.get(url)

        try: 
            contact_button = driver.find_element_by_xpath("//a[./span[contains(text(),'CONTACT') or contains(text(),'Contact')]] |  //a[contains(text(),'CONTACT') or contains(text(),'Contact')]")
        except NoSuchElementException:
            print("Can't find the contact button")
            getData(url)
        else:
            contact_link = contact_button.get_attribute('href')
            print(contact_link)
            try:
                driver.delete_all_cookies()
                driver.get(contact_link)
            except Exception as e:
                print('An exception occured: ', e)
                driver.get(url)
                getData(url)
            else:
                getData(contact_link)


    pprint.pprint(df)
    df.to_excel("websites_data_emails_new.xlsx")
    driver.quit()

if __name__ == "__main__":
    main()