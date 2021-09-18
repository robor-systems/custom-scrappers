# Special thanks to Sigma Coding.
# https://github.com/areed1192/sigma_coding_youtube/tree/master/python/python-api/google-maps
# You can check them out at:
# https://www.youtube.com/channel/UCBsTB02yO0QGwtlfiv5m25Q

# TODO:
# Add exception handling for disconnection

import googlemaps
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

# global results var
stored_results = []


def writesheet(results, state):
    # -------------- DUMPING VALUES IN EXCEL -----------------------
    # define the headers, that is just the key of each result dictionary.
    # row_headers = stored_results[0].keys()
    clean_headers = ["Business Name", "Address", "City", "Zip", "Lat/Long", "Business Status", "Map URL", "Business Type API",
                     "Phone Number", "Website", "Business Type (Map)", "Place_id", "Keyword Used"]

    print("Initializing workbook")

    worksheet = None
    workbook = None
    # create a new workbook and a new worksheet.
    try:
        workbook = xlsxwriter.Workbook(f'../output/{state}.xlsx')
    except Exception as err:
        print(err)
        print("Something went wrong... dumping in JSON instead")
        with open(f"{state}_error.json", "a") as write_file:
            json.dump(results, write_file)

    worksheet = workbook.add_worksheet()

    if worksheet is None:
        print("Worksheet not created... dumping in JSON instead")
        with open(f"{state}.json", "a") as write_file:
            json.dump(results, write_file)
    # populate the header row
    colIter = 0
    for header in clean_headers:
        worksheet.write(0, colIter, header)
        colIter += 1

    rowIter = 1
    colIter = 0
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
        if 'zip' in final_result:
            str_zip = final_result['zip']
        else:
            str_zip = "Not Found"
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

        result_values = [str_business_name, str_address, str_city, str_zip, str_lat_long, str_status, str_maps_url,
                         str_business_type, str_int_phone, str_website, str_business_type_extracted, str_place_id,
                         str_keyword]

        # get the values from each result.
        # result_values = final_result.values()

        # loop through each value in the values component.
        try:
            for value in result_values:
                worksheet.write(rowIter, colIter, str(value))
                colIter += 1
        except Exception as e:
            print(e)
            with open(f"{state}.json", "a") as write_file:
                json.dump(results, write_file)

        # make sure to go to the next row & reset the column.
        rowIter += 1
        colIter = 0

    # close the workbook
    workbook.close()


# Define the API Key.
api_key_client = os.environ.get('API_KEY_CLIENT')
# Define the Client
gmaps = googlemaps.Client(key=api_key_client)

chrome_options = Options()
chrome_options.add_argument("--headless")
# driver = webdriver.Chrome(r'C:\Users\danis\Python\lib\chromedriver_83.0.4103.39.exe', chrome_options=chrome_options)  # For PC
driver = webdriver.Chrome(
    r'C:\Users\danis\Python\chromedriver.exe', chrome_options=chrome_options)  # For Laptop


def collectDetails(places_results, keyword, city, zipCode, state, reqCount):
    for result in places_results:
        for place in result['results']:
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

            place_details = None

            for retry in range(50):
                if retry == 49:
                    writesheet(stored_results, state)
                    sys.exit()
                try:
                    print("Trying Places Details API")
                    place_details = gmaps.place(
                        place_id=my_place_id, fields=my_fields)
                    reqCount += 1
                except googlemaps.exceptions._OverQueryLimit as err:
                    print(err)
                    print(
                        "***********************************************")
                    print("QUERY LIMIT REACHED. NOW EXITING")
                    print(
                        "***********************************************")
                    writesheet(stored_results, state)
                except googlemaps.exceptions._RetriableRequest as err:
                    print(err)
                    time.sleep(retry)
                    print("Retrying After " + str(retry))
                    continue
                except Exception as err:
                    print(err)
                    print(
                        "Something went wrong... saving progress")
                    writesheet(stored_results, state)

                print("About to break after details API")
                break

            if place_details is None:
                print(
                    "Empty result for some reason... saving progress")
                writesheet(stored_results, state)
                continue

            status = place_details['status']

            print("***********************************************")
            print("API STATUS: " + str(status))
            print("REQUEST COUNTER: " + str(reqCount))
            print("***********************************************")

            if status != "OK":
                if status == "ZERO_RESULTS":
                    continue
                else:
                    writesheet(stored_results, state)
                    sys.exit()

            url = place_details['result']['url']
            # use selenium to get business types
            for retry in range(50):
                if retry == 49:
                    writesheet(stored_results, state)
                    sys.exit()
                try:
                    print("Accessing URL Through Selenium")
                    print('FROM url: ', url)
                    driver.get(url)
                except Exception as err:
                    print(err)
                    print("Retrying After " + str(2))
                    time.sleep(2)
                    continue

                print("About to break after extracting URL")
                break

            wait = WebDriverWait(driver, 10)

            try:
                type_business = wait.until(
                    EC.visibility_of_element_located(
                        (By.CSS_SELECTOR, 'button[jsaction="pane.rating.category"]')))
                if type_business is not None:
                    type_business_text = type_business.text
                    print('THIS IS THE BUSINESS: ',
                          type_business_text)
                    place_details['result']['business_type_extracted'] = type_business_text
                if type_business is None:
                    print('************* PROBLEM **************')
                    print('IS THIS EMPTY? ', type_business)
                    print('url: ', url)
                    place_details['result']['business_type_extracted'] = "Not Found"
            except TimeoutException:
                place_details['result'][
                    'business_type_extracted'] = "Request Timed Out"
                place_details['result']['city'] = city
                place_details['result']['zip'] = zipCode
                stored_results.append(place_details['result'])
                pass
            except Exception as err:
                print(err)
                place_details['result'][
                    'business_type_extracted'] = "Not Found(Raised Exception)"
                place_details['result']['city'] = city
                place_details['result']['zip'] = zipCode
                stored_results.append(place_details['result'])
                pass

            # storing city
            place_details['result']['city'] = city
            place_details['result']['zip'] = zipCode
            place_details['result']['keyword'] = keyword

            stored_results.append(place_details['result'])

            with open(f"../output/raw/places_details_raw.json", "w") as write_file:
                json.dump(stored_results, write_file)


def collectData(keyword, zipCode, state, reqCount):
    print("***********************************************")
    print("///////////////////////////////////////////////")
    print("PROCESSING FOR ZIP, STATE: ", zipCode, state)
    print("///////////////////////////////////////////////")
    print("***********************************************")

    places_results = []
    res = None

    for retry in range(50):
        if retry == 49:
            writesheet(stored_results, state)
            sys.exit()
        try:
            res = gmaps.places(
                f"{keyword} near {zipCode}, {state}, US", language="en", radius="1000")
            reqCount += 1
        except googlemaps.exceptions._OverQueryLimit as err:
            print(err)
            print("***********************************************")
            print("QUERY LIMIT REACHED. NOW EXITING")
            print("***********************************************")
            writesheet(stored_results, state)
        except googlemaps.exceptions._RetriableRequest as err:
            print(err)
            time.sleep(retry)
            print("Retrying After " + str(retry))
            continue
        except Exception as err:
            print(err)
            print("Something went wrong... saving progress")
            writesheet(stored_results, state)

        print("About to break")
        break

    if res is None:
        print("Empty result for some reason... saving progress")
        writesheet(stored_results, state)
        return

    status = res['status']

    print("***********************************************")
    print("API STATUS: " + str(status))
    print("REQUEST COUNTER: " + str(reqCount))
    print("***********************************************")

    if status != "OK":
        if status == "ZERO_RESULTS":
            return
        else:
            writesheet(stored_results, state)
            sys.exit()

    places_results.append(res)

    with open(f"../output/raw/places_data_raw.json", "a") as write_file:
        json.dump(places_results, write_file)

    return places_results


req_count = 0


def main():
    keyword = 'Plumbing OR HVAC OR Heavy Duty OR Construction OR Electrical OR Cleaning OR Pest Control OR Painting OR Inspector OR Landscaping'

    num_requests = 10000

    rawData = pd.read_excel('../input/input_cities.xlsx', sheet_name='Sheet1')
    rawData.dropna(how='all', inplace=True)

    for index, row in rawData.iterrows():
        zipCode = str(int(row['Zip']))
        str_state = row['State']
        city = row['City']

        if req_count > num_requests:
            print("///////////////////////////////////////////////")
            print("STOPPING AT STATE: " + str_state)
            print("///////////////////////////////////////////////")
            writesheet(stored_results, str_state)
            sys.exit()

        placesResults = collectData(keyword, zipCode, str_state, req_count)

        if placesResults is not None:
            collectDetails(placesResults, keyword, city,
                           zipCode, str_state, req_count)

    print('All done!')
    writesheet(stored_results, 'Valvoline_competitors_end')
    driver.quit()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        writesheet(stored_results, 'valvo_data')
