import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, send_file
from werkzeug import secure_filename
from netCDFtoCSV import convertFile
import numpy as np
from scipy.signal import gaussian
from scipy.ndimage import filters

app = Flask(__name__)
app.debug = True

UPLOAD_FOLDER = './cdf/'
ALLOWED_EXTENSIONS = ['cdf']
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def ensure_dir(f):
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)

@app.route('/', methods=['GET'])
def index():
    ensure_dir(app.config['UPLOAD_FOLDER'])
    file_list = [".".join(f.split(".")[:-1]) for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)]
    return  render_template('index.html', file_list=file_list)

@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        print request.files.getlist('file')
        for f in request.files.getlist('file'):
            if f and allowed_file(f.filename):
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                convertFile(app.config['UPLOAD_FOLDER'],filename)
        return redirect(url_for('index'))

@app.route('/view/<filename>')
def view_file(filename):
    filename = os.path.join(app.config['UPLOAD_FOLDER'], filename +'.csv')
    if os.path.isfile(filename):
        return render_template('view.html', filename=filename)
    else:
        return redirect(url_for('index'))

@app.route('/data/<filename>')
def return_data(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename +'.csv')

@app.route('/background/<filename>')
def sub_background(filename):
    pathname = os.path.join(app.config['UPLOAD_FOLDER'], filename +'.csv')
    background = [float(request.args.get('min')),float(request.args.get('max'))]

    with file(pathname, 'r') as f:
        i = 0
        for line in f:
            if i == 0:
                time = []
                total = []
                i += 1
            else:
                time.append(float(line.split(',')[0]))
                total.append(sum([long(j) for j in line.split(',')[1:]]))
    bg = [total[i] for i in xrange(len(total)) if time[i] >= background[0] and time[i] <= background[1]]
    bg_avg = sum(bg)/len(bg)
    total = [i-bg_avg for i in total]

    bg_file = filename + '-bg-subtracted.csv'

    with file(os.path.join(app.config['UPLOAD_FOLDER'],bg_file), 'w') as f:
        f.write('Time,Total\n')
        for i in xrange(len(time)):
            f.write(str(time[i]) + ',' + str(total[i]) + '\n')

    data = np.genfromtxt(os.path.join(app.config['UPLOAD_FOLDER'],bg_file), delimiter=',', skip_header=1)
    x = data[:,0]
    y = data[:,1]
    filtered = testGauss(x,y)
    filtered_sum = cum_sum(filtered)

    bg_filter_file = filename + '-bg-filtered.csv'

    with file(os.path.join(app.config['UPLOAD_FOLDER'],bg_filter_file), 'w') as f:
        f.write('Cumulative Sum,' + str(filtered_sum) + '\n')
        f.write('Time,Total\n')
        for i in xrange(len(x)):
            f.write(str(x[i]) + ',' + str(filtered[i]) + '\n')


    return send_file(os.path.join(app.config['UPLOAD_FOLDER'],bg_filter_file), attachment_filename=bg_filter_file,as_attachment=True)

def cum_sum(filtered):
    cum_sum = 0
    flag = 0
    for i in filtered:
        if not flag and i > 0:
            flag = 1
        if flag and i < 0:
            break
        if flag:
            cum_sum += i
    return cum_sum

def testGauss(x, y):
    b = gaussian(39, 10)
    ga = filters.convolve1d(y, b/b.sum())
    return ga

if __name__ == '__main__':
    app.run()
