# Flask-Spectrometry

This web app is meant to be ran locally in order to convert and analyze data from Extrel's Merlin mass spectrometry software.  A sample cdf file is included in the repository.

To run the app, clone this repository:

```
git clone https://github.com/SUNYCNSE-ERIC/Flask-Spectrometry.git
cd Flask-Spectrometry
```

Set up a virtualenv, install the requirements, and run the app:

``` bash
virtualenv env

source env/bin/activate # Linux/OS X
"env/Scripts/activate" # Windows

pip install -r requirements.txt

python run.py # Run in terminal
pythonw run.py # Run in background
```

Visit http://localhost:5000 to view the app.