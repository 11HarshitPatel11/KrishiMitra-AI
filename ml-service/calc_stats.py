import pandas as pd
import json

df = pd.read_csv('datasets/Crop_recommendation.csv')

def get_stats(series):
    return {
        'min': float(series.min()),
        'max': float(series.max()),
        'mean': float(series.mean()),
        'median': float(series.median()),
        'std': float(series.std()),
        'q1': float(series.quantile(0.25)),
        'q3': float(series.quantile(0.75)),
        'num_0': int((series == 0).sum()),
        'num_lt_1': int((series < 1).sum()),
        'num_lt_5': int((series < 5).sum()),
        'num_lt_10': int((series < 10).sum()),
        'num_lt_20': int((series < 20).sum())
    }

overall = get_stats(df['rainfall'])

per_crop = {}
for crop in df['label'].unique():
    per_crop[crop] = get_stats(df[df['label'] == crop]['rainfall'])

output = {
    'overall': overall,
    'per_crop': per_crop
}

with open('rainfall_stats.json', 'w') as f:
    json.dump(output, f, indent=4)
