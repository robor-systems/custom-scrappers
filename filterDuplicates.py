import os
import pandas as pd
mainDir = "./output/compiled/withIds"


# Check throught all the output files and remove duplicates
def remove_duplicates(file_name):
    print(file_name)
    df = pd.read_csv(file_name, sep=",")
    df.drop_duplicates(subset='website', inplace=True)
    df.to_csv('mrd-filtered.csv', index=False)


remove_duplicates('mrd.csv')
# loop through files in output dir


def loop_through_all_files():
    # list files in output dir
    files = os.listdir(mainDir)
    # Call remove_duplicates function on each file
    for file in files:
        remove_duplicates(mainDir+'/'+file)


# loop_through_all_files()
