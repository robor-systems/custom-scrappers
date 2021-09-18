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
from selenium.common.exceptions import TimeoutException

import os
from dotenv import load_dotenv

load_dotenv() # read .env file

# chrome_options = Options()
# chrome_options.add_argument()
# driver = webdriver.Chrome(r'C:\Users\danis\Python\lib\chromedriver_83.0.4103.39.exe', chrome_options=chrome_options)  # For PC
driver = webdriver.Chrome(
    'chromedriver.exe')  # For Laptop

driver.get('https://google.com')
wait = WebDriverWait(driver, 10)