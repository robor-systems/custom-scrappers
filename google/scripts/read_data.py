import pprint
import xlsxwriter
import csv
import pprint
import sys
import pandas as pd
import xlsxwriter


def main(stored_results):
    rawData = pd.read_excel('../input/cities_data.xlsx', sheet_name='Sheet1')
    rawData.dropna(how='all', inplace=True)
    pprint.pprint(rawData)
    workbook = xlsxwriter.Workbook(f'../output/testing.xlsx')
    worksheet = workbook.add_worksheet()
    rowIter = 0
    for index, row in rawData.iterrows():
        zipCode = str(int(row['Zip']))
        state = row['State']
        city = row['City']
        print(type(state))
        # print(zipCode, state, city)
        # worksheet.write(row, 0, str(collect))
        worksheet.write(rowIter, 0, zipCode + state + city)
        rowIter += 1
    workbook.close()


if __name__ == "__main__":
    stored_results = []
    try:
        main(stored_results)
    except KeyboardInterrupt:
        print('Keyboard interrupt occured')
