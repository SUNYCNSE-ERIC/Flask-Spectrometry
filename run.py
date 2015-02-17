import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify, send_file
from werkzeug import secure_filename
from netCDFtoCSV import convertFile
import numpy as np
from scipy.signal import gaussian
from scipy.ndimage import filters


# Init Flask App
app = Flask(__name__)
app.debug = True

# Set Upload Folder for files and Allowed Extensions
UPLOAD_FOLDER = './cdf/'
ALLOWED_EXTENSIONS = ['csv']
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    """
    Only allow files with extensions and files that have an extension in ALLOWED_EXTENSIONS
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

def is_filtered(filename):
    """
    Return true if filename ends in filtered.csv
    """
    try:
        return '.' in filename and \
               filename.rsplit('-', 1)[1] == 'bg.csv'
    except IndexError:
	    return False

def ensure_dir(f):
    """
    Checks if directory exists and creates it if not.
    """
    d = os.path.dirname(f)
    if not os.path.exists(d):
        os.makedirs(d)

@app.route('/', methods=['GET'])
def index():
    """
    Home of the app.  Get's a list a files with the ".cdf" extension and filtered files for the "index.html" template.
    """
    ensure_dir(app.config['UPLOAD_FOLDER'])
    file_list = [f.rsplit('.', 1)[0] for f in os.listdir(UPLOAD_FOLDER) if allowed_file(f)]
    smoothed_files = [f.rsplit('.',1)[0].rsplit('-',1)[0] for f in os.listdir(UPLOAD_FOLDER) if is_filtered(f)]
    return  render_template('index.html', file_list = file_list, smoothed = smoothed_files)

@app.route('/upload', methods=['POST'])
def upload():
    """
    Path for uploads only.  Saves file into UPLOAD_FOLDER, converts file from netCDF to csv, and redirects to /
    """
    if request.method == 'POST':
        for f in request.files.getlist('file'):
            if f and allowed_file(f.filename):
                filename = secure_filename(f.filename)
                f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                convertFile(app.config['UPLOAD_FOLDER'],filename)
        return redirect(url_for('index'))

@app.route('/view/<filename>')
def view_file(filename):
    """
    Main view for csv files.  Render view.html template for background subtraction.
    """
    filename = os.path.join(app.config['UPLOAD_FOLDER'], filename +'.csv')
    if os.path.isfile(filename):
        return render_template('view.html', filename=filename)
    else:
        return redirect(url_for('index'))

@app.route('/viewrange/<filename>')
def view_range(filename):
    filename = os.path.join(app.config['UPLOAD_FOLDER'], filename +'.csv')
    if os.path.isfile(filename):
        return render_template('viewrange.html', filename=filename)
    else:
        return redirect(url_for('index'))

@app.route('/smooth/<filename>')
def view_smooth(filename):
    filename = os.path.join(app.config['UPLOAD_FOLDER'], filename + '-bg.csv')
    if os.path.isfile(filename):
        return render_template('smooth.html', filename=filename)
    else:
        return redirect(url_for('index'))   

@app.route('/data/<filename>')
def return_data(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename +'.csv')

@app.route('/smoothdata/<filename>')
def return_smooth_data(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename +'-bg.csv')

@app.route('/background/<filename>', methods=['POST'])
def sub_background(filename):
    pathname = os.path.join(app.config['UPLOAD_FOLDER'], filename +'.csv')
    signal = [float(request.form.get('sig0')),float(request.form.get('sig1'))]
    background = [float(request.form.get('bkg0')),float(request.form.get('bkg1'))]
    n = request.form.get('n')

    data = np.genfromtxt(pathname, delimiter=',', skip_header=1)

    time = data[:,0]
    data = data[:,1:]

    cum = np.zeros(time.shape)
    total = np.zeros(time.shape)

    sig_ind = [0,0]
    bkg_ind = [0,0]

    for i in xrange(time.shape[0]):
        if signal[0] <= time[i] and signal[0] >= time[i-1]:
            sig_ind[0] = i
        elif signal[1] <= time[i] and signal[1] >= time[i-1]:
            sig_ind[1] = i
        elif background[0] <= time[i] and background[0] >= time[i-1]:
            bkg_ind[0] = i
        elif background[1] <= time[i] and background[1] >= time[i-1]:
            bkg_ind[1] = i

    bkg_mean = np.mean( np.sum( data[bkg_ind[0]:bkg_ind[1],:], axis = 1 ) )

    with file(pathname.rsplit('.', 1)[0] + '-' + n + '-bg.csv', 'w') as f:
        f.write('Time,Counts,Cumulative\n')
        for i in xrange(time.shape[0]):
            total[i] = np.sum(data[i,:]) - bkg_mean
            if i >= sig_ind[0] and i < sig_ind[1]:
                cum[i] = cum[i-1] + total[i]
            f.write(','.join([str(j) for j in [time[i], total[i], cum[i]]]))
            f.write('\n')

    # data = np.genfromtxt(os.path.join(app.config['UPLOAD_FOLDER'],bg_file), delimiter=',', skip_header=1)
    # x = data[:,0]
    # y = data[:,1]
    # filtered = testGauss(x,y)
    # filtered_sum, mov_sum = sums(filtered)

    # bg_filter_file = filename + '-bg-filtered.csv'

    # with file(os.path.join(app.config['UPLOAD_FOLDER'],bg_filter_file), 'w') as f:
    #     f.write('Time,Counts,Moving Sum,Cumulative\n')
    #     for i in xrange(len(x)):
    #         f.write(str(x[i]) + ',' + str(filtered[i]) + ',' + str(mov_sum[i]))
    #         if i == 0:
    #             f.write(',' + str(filtered_sum))
    #         f.write('\n')

    return redirect(url_for('index'))

# def sums(filtered):
#     cum_sum = 0
#     mov_sum = np.array([])
#     flag1 = 0
#     flag2 = 0
#     for i in filtered:
#         if not flag1 and i > 0:
#             flag1 = 1
#         if flag1 and i < 0:
#             flag2 = 1
#         if flag1 and not flag2:
#             cum_sum += i
#             try:
#                 mov_sum = np.append(mov_sum, mov_sum[-1]+i)
#             except IndexError:
#                 mov_sum = np.append(mov_sum, i)
#         else:
#             try:
#                 mov_sum = np.append(mov_sum, mov_sum[-1])
#             except IndexError:
#                 mov_sum = np.append(mov_sum, 0)
#     return cum_sum, mov_sum

# def testGauss(x, y):
#     b = gaussian(39, 10)
#     ga = filters.convolve1d(y, b/b.sum())
#     return ga

if __name__ == '__main__':
    app.run()
