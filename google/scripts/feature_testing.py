# Special thanks to Sigma Coding.
# https://github.com/areed1192/sigma_coding_youtube/tree/master/python/python-api/google-maps
# You can check them out at:
# https://www.youtube.com/channel/UCBsTB02yO0QGwtlfiv5m25Q

import googlemaps
import json
import pprint
import xlsxwriter
import time
import csv
import pprint
import sys

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException

import os
from dotenv import load_dotenv

load_dotenv() # read .env file


def writesheet(results, state):
    # -------------- DUMPING VALUES IN EXCEL -----------------------
    # define the headers, that is just the key of each result dictionary.
    # row_headers = stored_results[0].keys()
    clean_headers = ["Business Name", "Address", "City", "Lat/Long", "Business Status", "Map URL", "Business Type API",
                     "Phone Number", "Website", "Business Type (Map)", "Place_id", "Keyword Used"]

    print("Initializing workbook")
    # create a new workbook and a new worksheet.
    workbook = xlsxwriter.Workbook(f'Results/{state}.xlsx')
    worksheet = workbook.add_worksheet()

    # populate the header row
    col = 0
    for header in clean_headers:
        worksheet.write(0, col, header)
        col += 1

    row = 1
    col = 0
    # populate the other rows

    # get each result from the list.
    for final_result in results:
        if 'name' in final_result:
            str_business_name = final_result['name']
        else:
            str_business_name = "Not Found"
        if 'formatted_address' in final_result:
            str_address = final_result['formatted_address']
        else:
            str_address = "Not Found"
        if 'city' in final_result:
            str_city = final_result['city']
        else:
            str_city = "Not Found"
        if 'geometry' in final_result:
            geo = final_result['geometry']
            str_lat_long = geo['location']
        else:
            str_lat_long = "Not Found"
        if 'business_status' in final_result:
            str_status = final_result['business_status']
        else:
            str_status = "Not Found"
        if 'url' in final_result:
            str_maps_url = final_result['url']
        else:
            str_maps_url = "Not Found"
        if 'types' in final_result:
            str_business_type = final_result['types']
        else:
            str_business_type = "Not Found"
        if 'international_phone_number' in final_result:
            str_int_phone = final_result['international_phone_number']
        else:
            str_int_phone = "Not Found"
        if 'website' in final_result:
            str_website = final_result['website']
        else:
            str_website = "Not Found"
        if 'business_type_extracted' in final_result:
            str_business_type_extracted = final_result['business_type_extracted']
        else:
            str_business_type_extracted = "Not Found"
        if 'place_id' in final_result:
            str_place_id = final_result['place_id']
        else:
            str_place_id = "Not Found"
        if 'keyword' in final_result:
            str_keyword = final_result['keyword']
        else:
            str_keyword = "Not Found"

        result_values = [str_business_name, str_address, str_city, str_lat_long, str_status, str_maps_url,
                         str_business_type, str_int_phone, str_website, str_business_type_extracted, str_place_id,
                         str_keyword]

        # get the values from each result.
        # result_values = final_result.values()

        # loop through each value in the values component.
        for value in result_values:
            worksheet.write(row, col, str(value))
            col += 1

        # make sure to go to the next row & reset the column.
        row += 1
        col = 0

    # close the workbook
    workbook.close()


def main():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    # driver = webdriver.Chrome(r'C:\Users\danis\Python\lib\chromedriver_83.0.4103.39.exe', chrome_options=chrome_options)  # For PC
    driver = webdriver.Chrome(r'C:\Users\danis\Python\chromedriver.exe', chrome_options=chrome_options)  # For Laptop

    keywords = ["Lube"]  # Oil Change # Lube
    # Define the API Key.
    api_key_client = os.environ.get('API_KEY_CLIENT')
    # Define the Client

    # TODO:
    # VERIFY API KEY ALWAYS

    gmaps = googlemaps.Client(key=api_key_client)
    req_count = 0
    with open('input_cities.csv') as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')
        cities = []
        for rows in csv_reader:
            str_state = rows[0]
            cities = rows[1:]
            clean_cities = []
            for city in cities:
                if city != '':
                    clean_cities.append(city)

            print("Name of state is: " + str_state)
            pprint.pprint("Cities are: " + str(clean_cities))

            stored_results = []
            print("***********************************************")
            print("///////////////////////////////////////////////")
            print("PROCESSING FOR STATE: " + str_state)
            print("///////////////////////////////////////////////")
            print("***********************************************")
            for city in clean_cities:  # pen_cities:
                for keyword in keywords:

                    if req_count > 8900:
                        writesheet(stored_results, str_state)
                        sys.exit()

                    places_results = []
                    pprint.pprint('Getting Data for ' + city)

                    res = gmaps.places(f"{keyword} in {city}, {str_state}", language="en",
                                       type="car_repair", radius="2000")
                    req_count += 1

                    status = res['status']

                    print("***********************************************")
                    print("API STATUS: " + str(status))
                    print("REQUEST COUNTER: " + str(req_count))
                    print("***********************************************")

                    if status != "OK":
                        if status == "ZERO_RESULTS":
                            continue
                        else:
                            writesheet(stored_results, str_state)
                            sys.exit()

                    places_results.append(res)

                    while 'next_page_token' in res:
                        # pprint.pprint("Reading from next page in 3 seconds")
                        time.sleep(3)
                        res = gmaps.places(query=f"{keyword} in {city}, {str_state}", page_token=res['next_page_token'])

                        status = res['status']

                        print("***********************************************")
                        print("API STATUS: " + str(status))
                        print("***********************************************")

                        if status != "OK":
                            if status == "ZERO_RESULTS":
                                continue
                            else:
                                writesheet(stored_results, str_state)
                                sys.exit()

                        places_results.append(res)

                    for result in places_results:
                        for place in result['results']:

                            if req_count > 8900:
                                writesheet(stored_results, str_state)
                                sys.exit()

                            # pprint.pprint(place)

                            # getting place ID
                            my_place_id = place["place_id"]
                            my_fields = ['name', 'business_status', "formatted_address", "formatted_phone_number",
                                         "website",
                                         'type', 'geometry', 'icon', 'place_id', 'plus_code', 'url', 'utc_offset',
                                         'vicinity',
                                         "international_phone_number"]

                            # Iterating through stored results to ensure that the current value is not duplicate
                            # If it is duplicate then skip this result
                            duplicate = False
                            for clean_result in stored_results:
                                if my_place_id == clean_result['place_id']:
                                    duplicate = True
                                    break
                            if duplicate:
                                continue

                            place_details = gmaps.place(place_id=my_place_id, fields=my_fields)
                            req_count += 1

                            status = place_details['status']

                            print("***********************************************")
                            print("API STATUS: " + str(status))
                            print("REQUEST COUNTER: " + str(req_count))
                            print("***********************************************")

                            if status != "OK":
                                if status == "ZERO_RESULTS":
                                    continue
                                else:
                                    writesheet(stored_results, str_state)
                                    sys.exit()

                            url = place_details['result']['url']

                            print('FROM url: ', url)

                            driver.get(url)
                            wait = WebDriverWait(driver, 10)
                            try:
                                type_business = wait.until(
                                    EC.visibility_of_element_located(
                                        (By.CSS_SELECTOR, 'button[jsaction="pane.rating.category"]')))
                                if type_business is not None:
                                    type_business_text = type_business.text
                                    print('THIS IS THE BUSINESS: ', type_business_text)
                                    place_details['result']['business_type_extracted'] = type_business_text
                                if type_business is None:
                                    print('************* PROBLEM **************')
                                    print('IS THIS EMPTY? ', type_business)
                                    print('url: ', url)
                                    place_details['result']['business_type_extracted'] = "Not Found"
                            except TimeoutException:
                                place_details['result']['business_type_extracted'] = "Not Found(Raised Exception)"
                                place_details['result']['city'] = city
                                stored_results.append(place_details['result'])
                                pass

                            # storing city
                            place_details['result']['city'] = city
                            place_details['result']['keyword'] = keyword

                            stored_results.append(place_details['result'])
                        print("ITERATED ONE PAGE")
                    print("ITERATED THE KEYWORD: " + str(keyword))
                print("ITERATED ALL RESULTS IN" + str(city))
            print("ABOUT TO QUIT CHROME")
            writesheet(stored_results, str_state)
    driver.quit()


if __name__ == "__main__":
    main()
