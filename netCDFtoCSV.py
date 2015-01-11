import numpy as np
from scipy.io import netcdf
import os
import sys
import argparse

def genCounts(path,filename):
    with netcdf.netcdf_file(os.path.join(path,filename), 'r') as f:
        v = f.variables

        # Times and masses into np arrays
        time = np.array(v['scan_acquisition_time'][:], dtype=np.float)
        masses = np.array(range(1,201))
        counts = np.zeros((len(time),len(masses)), dtype=np.int64)
        
        # Counter for scan number (due to nature of the netcdf data) 
        cur = 0
        # Need prev to be 0 for first iteration
        prev = 1
        for i in xrange(v['intensity_values'].shape[0]):
            if v['intensity_values'][i] != 0 and prev == 0:
                cur += 1
            mass = round(v['mass_values'][i])
            counts[cur,mass-1] += v['intensity_values'][i]
            prev = v['intensity_values'][i]
    pos_masses = [i+1 for i in xrange(counts.shape[1]) if not all(count == 0 for count in counts[:,i])]
    counts = [[counts[i,j-1] for j in pos_masses] for i in xrange(counts.shape[0])]
    return counts, time, pos_masses

def writeAllScanData(path,filename,counts,time,masses):
    # Write out all counts of scans to CSV
    fileout = os.path.join(path,os.path.splitext(filename)[0] + '.csv')
    with file(fileout, 'w') as g:
        g.write('Time' + ',' + ','.join([str(i) for i in masses]))
        g.write('\n')
        for i in xrange(len(time)):
            g.write(str(time[i]) + ',')
            g.write(','.join([str(count) for count in counts[i]]))
            g.write('\n')

def writeTotalCounts(path,filename,counts,time,masses):
    # Write out total counts for each mass
    fileout = os.path.join(path,os.path.splitext(filename)[0] + '_TotalCounts.csv')
    with file(fileout, 'w') as g:
        g.write('Mass,Total Counts\n')
        for i in xrange(len(masses)):
            g.write(str(masses[i]) + ',' + str(sum([counts[j][i] for j in xrange(len(counts))])))
            g.write('\n')

def convertFile(path,filename):
    counts, time, masses = genCounts(path,filename)
    writeAllScanData(path,filename,counts,time,masses)

if __name__ == '__main__':
    try:
        convertFile('./',sys.argv[1])
    except IndexError:
        print "Include the netCDF file that you want to convert."