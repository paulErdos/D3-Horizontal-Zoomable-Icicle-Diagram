from svg.path import Path, parse_path
from lxml import etree as ET
import json

def getpathroute(node):

    #create path list to be interated through in d3.
    path_route = ["div[id='brain']", "svg[id='brain_svg']"]
    path_route.append("g[id='p" + node.getparent().getparent()[0].attrib["id"] + "']")
    path_route.append("g[id='" + node.getparent().attrib["id"] + "']")
    path_route.append("path[id='" + node.attrib["id"] + "']")
    return path_route




def addpathid(root, curr):
    if 'path' in curr.tag:
        if int(curr.attrib['structure_id']) == int(root['id']):
            
            #add/update path id attribute
            path_area = parse_path( curr.attrib["d"] ).area()
            slice_id = "p" + curr.getparent().getparent()[0].attrib["id"]

            if 'path_ids' in root:
                root['path_ids'].append(curr.attrib['id'])
                root['path_areas'].append(path_area)
                root['path_routes'].append(getpathroute(curr))
                root['slice_ids'].append(slice_id)
                root['ave_area'] = sum([a for a in root['path_areas']]) / len(root['path_ids'])
                root['volume'] += path_area
            else:
                root['path_ids'] = [curr.attrib['id']]
                root['path_routes'] = [getpathroute(curr)]
                root['path_areas'] = [path_area]
                root['slice_ids'] = [slice_id]
                root['ave_area'] = path_area
                root['volume'] = path_area


            root['largest_area'] = max( enumerate(root['path_areas']), key=lambda x: x[1] )

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

    open("allenwithpaths.json", "w").write(json.dumps(data, indent=4))
