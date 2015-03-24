from svg.path import Path, parse_path
from lxml import etree as ET
import json

def addpathid(root, curr):
    if 'path' in curr.tag:
        if int(curr.attrib['structure_id']) == int(root['id']):
            
            #add/update path id attribute
            path_area = parse_path( curr.attrib["d"] ).area()
            slice_id = "p" + curr.getparent().attrib["id"]

            if 'path_ids' in root:
                root['path_ids'].append(curr.attrib['id'])
                root['path_areas'].append(path_area)
                root['slice_ids'].append(slice_id)
                root['ave_area'] = sum([a for a in root['path_areas']]) / len(root['path_ids'])
                root['volume'] += path_area
            else:
                root['path_ids'] = [curr.attrib['id']]
                root['path_areas'] = [path_area]
                root['slice_ids'] = [slice_id]
                root['ave_area'] = path_area
                root['volume'] = path_area

            enummerated_areas = max( enumerate(root['path_areas']), key=lambda x: x[1] )
            index =  enummerated_areas[0]
            largest = enummerated_areas[1]
            root['largest_area'] = (index, largest)

    for child in curr:
        addpathid(root, child)



def addpaths(curr, root):
    addpathid(curr, root)
    if 'children' in curr:
        for child in curr['children']:
            addpaths(child, root)


if __name__ == "__main__":
    f = open('../allenwithwiki.json', 'r')
    # Load in the json file.
    data = json.loads(f.read())
    for line in json.loads(open('../extra/slices.json').read()):
        tree = ET.parse(line)
        root = tree.getroot()
        addpaths(data, root)

    open("allenwithpaths.json", "w").write(json.dumps(data))