import googlemaps
import json
import pprint
import xlsxwriter
import time

import os
from dotenv import load_dotenv

load_dotenv() # read .env file

# Define the API Key.
api_key_client = os.environ.get('API_KEY_CLIENT')

# Define the Client
gmaps = googlemaps.Client(key=api_key_client)

my_place_id = 'ChIJLzHzvahFQogRzNZ4G4l0Bh8'
my_fields = ['name', 'business_status', "formatted_address", "formatted_phone_number", "website", 'type', 'geometry',
             'icon', 'place_id', 'plus_code', 'url', 'utc_offset', 'vicinity', "international_phone_number"]

place_details = gmaps.place(place_id=my_place_id, fields=my_fields)
pprint.pprint(place_details)

results = place_details['result']

# if 'website' not in results:
#     resultsList = results.items()
#     print(resultsList)

# resultsList.insert(13,('Website','NOT FOUND'))
# stored_results.append(resultsList)

row_headers = ['business_status',
               'formatted_address',
               'formatted_phone_number',
               'geometry',
               'icon',
               'international_phone_number',
               'name',
               'place_id',
               'plus_code',
               'types',
               'url',
               'utc_offset',
               'vicinity'
               ]

clean_head = ["Business Name", "Address", "City", "Lat/Long", "Business Status", "Map URL", "Business Type API",
              "Phone Number", "Website", "Business Type (Map)", "Place_id", "Keyword Used"]

# pprint.pprint(row_headers)

# create a new workbook and a new worksheet.
workbook = xlsxwriter.Workbook(f'Results/Cleaned_values.xlsx')
worksheet = workbook.add_worksheet()

# populate the header row
col = 0
for header in clean_head:
    worksheet.write(1, col, header)
    col += 1

if 'name' in results:
    Bussiness_Name = results['name']
else:
    Business_Name = "Not Found"
if 'formatted_address' in results:
    Address = results['formatted_address']
else:
    Address = "Not Found"
if 'city' in results:
    City = results['city']
else:
    City = "Not Found"
if 'geometry' in results:
    geo = results['geometry']
    lat_long = geo['location']
else:
    lat_long = "Not Found"
if 'business_status' in results:
    Status = results['business_status']
else:
    Status = "Not Found"
if 'url' in results:
    Maps_URL = results['url']
else:
    Maps_URL = "Not Found"
if 'types' in results:
    Business_Type = results['types']
else:
    Business_Type = "Not Found"
if 'international_phone_number' in results:
    Int_Phone = results['international_phone_number']
else:
    Int_Phone = "Not Found"
if 'website' in results:
    Website = results['website']
else:
    Website = "Not Found"
if 'business_type_extracted' in results:
    Business_Type_Extracted = results['business_type_extracted']
else:
    Business_Type_Extracted = "Not Found"
if 'place_id' in results:
    Place_ID = results['place_id']
else:
    Place_ID = "Not Found"

stored_results = [Bussiness_Name, Address, City, lat_long, Status, Maps_URL, Business_Type, Int_Phone, Website,
                  Business_Type_Extracted, Place_ID]

row = 2
col = 0
for value in stored_results:
    worksheet.write(row, col, str(value))
    col += 1

workbook.close()
