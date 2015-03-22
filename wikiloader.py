import json
import wikipedia

def BFS(root):

    try: 
        root['summary'] = wikipedia.summary(root['name'])
    except:
        root['summary'] = "no data for this region"

    if 'children' in root:
        for child in root['children']:
            BFS(child)


if __name__ == "__main__":
    f = open('allen.json', 'r')

    # Load in the json file. Data is now an equivalent object.
    data = json.loads(f.read())

    BFS(data)

    open('allenwithwiki.json', 'w').write(json.dumps(data))





