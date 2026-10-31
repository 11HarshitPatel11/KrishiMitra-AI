# Datasets Directory

This directory is intended for raw data used to train the Machine Learning models.

## Expected Dataset
Place the raw dataset here and name it `Crop_recommendation.csv`.

**Expected columns:**
* N / nitrogen
* P / phosphorus
* K / potassium
* temperature
* humidity
* pH
* rainfall
* label / crop

> **CRITICAL RULE:** Never modify the original raw dataset once it is placed here. Keep raw data immutable to ensure 100% reproducibility. If preprocessing is required (e.g. transformations, imputing missing values, scaling), the ML pipeline will create a separate processed representation dynamically.
