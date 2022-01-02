import re
import csv
import multiprocessing

from lib.get_image_data import get_image_data
from os import listdir
from os.path import isfile, join, exists

multiple_cores = True
input_folder = "process_this"
output_file_name = 'output.csv'
csv_mode = 'a' if exists(output_file_name) else 'w'
header = ['name', 'price', 'avail', 'time', 'rank', 'time_stamp']
writer = None

date_pattern = re.compile(r"(?P<year>\d{4})(?P<month>\d\d)(?P<day>\d\d)(?P<hour>\d\d)(?P<min>\d\d)(?P<sec>\d\d)\_(?P<ms>\d)\.jpg$")

def parse_date_file(name):
    match = date_pattern.search(name)
    if match is None:
        print("Unknown file name " + name)
        return None

    return match['year'] + "-" + match['month'] + "-" +  match['day'] + "T" + match['hour'] + ":" +  match['min'] + ":" +  match['sec']

def process_file(file_name):
    data = get_image_data(file_name)
    time_stamp = parse_date_file(file_name)
    
    for row in data:
        row['time_stamp'] = time_stamp
        
    return {'data': data, 'file_name': file_name}

def save_results(results):
    print("Saving " + results['file_name'])
    for row in results['data']:
        writer.writerow([row[key] for key in header])

if __name__ == "__main__":
    image_files = [join(input_folder, f) for f in listdir(input_folder) if isfile(join(input_folder, f))]
    image_files = [f for f in image_files if not parse_date_file(f) is None]
    
    out_file = open(output_file_name, csv_mode, newline='')
    writer = csv.writer(out_file)

    if csv_mode == 'w':
        writer.writerow(header)
    
    index = 0

    if multiple_cores: p = multiprocessing.Pool() 

    for f in image_files:
        print(str(index) + ". Processing " + f)
        index += 1
        p.apply_async(process_file, [f], callback=save_results) if multiple_cores else save_results(process_file(f))
    
    if multiple_cores:
        p.close()
        p.join()

    out_file.close()
