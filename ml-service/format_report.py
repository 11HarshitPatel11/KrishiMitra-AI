import json

d = json.load(open('rainfall_stats.json'))

with open('report.txt', 'w') as f:
    f.write("OVERALL:\n")
    for k, v in d['overall'].items():
        f.write(f"  {k}: {v}\n")
    
    f.write("\nPER CROP (first 5 for example):\n")
    for k, v in list(d['per_crop'].items())[:5]:
        f.write(f"  {k}: min={v['min']:.1f}, max={v['max']:.1f}, mean={v['mean']:.1f}, median={v['median']:.1f}\n")
    
    # Just to get min/max over all crops easily readable
    for k, v in d['per_crop'].items():
        if k == 'muskmelon':
            f.write(f"  {k} (example): min={v['min']:.1f}, max={v['max']:.1f}, mean={v['mean']:.1f}, median={v['median']:.1f}\n")
