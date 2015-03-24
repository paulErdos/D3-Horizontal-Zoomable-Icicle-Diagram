import json
from collections import OrderedDict

def freqcount(root, freq):
    if 'largest_area' in root:
        if not 'largest_area' in root: raise

        slice_id = root['slice_ids'][root['largest_area'][0]]
        
        # Instantiate this node's 'vote" for the best slice.
        if slice_id in freq:
            freq[slice_id] += 1
        else:
            freq[slice_id] = 1

    if 'children' in root:
        for child in root['children']:
            freqcount(child, freq)

def addbestslice(root):

    freq = OrderedDict({})
    freqcount(root, freq)

    if len(freq) > 0:
        root['best_slice'] = max( zip(freq.keys(), freq.values()), key=lambda x: x[1] )[0]

def addslices(root):
    addbestslice(root)
    
    if 'children' in root:
        for child in root['children']:
            addslices(child)

if __name__ == "__main__":
    f = open('allenwithpaths.json', 'r')

    data = json.loads(f.read())

    addslices(data)

    open("allenwithslice.json", "w").write(json.dumps(data))
