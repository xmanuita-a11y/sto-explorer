"""Annotate trusted template text. User-provided data never enters this pass."""
from html.parser import HTMLParser
from html import escape
import json

VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

class Template(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]
        self.messages = set()
    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break
    def handle_data(self, text):
        self.stack[-1].children.append(text)
    def render(self, node=None, skip=False):
        node = self.root if node is None else node
        skip = skip or node.tag in ('style','script','noscript')
        attrs = dict(node.attrs)
        local_attrs = {key:value for key,value in attrs.items() if key in ('placeholder','aria-label','title') and value}
        if local_attrs and not skip:
            self.messages.update(local_attrs.values())
            attrs['data-i18n-attrs'] = json.dumps(local_attrs, ensure_ascii=False)
        plain = node.children and all(isinstance(child,str) for child in node.children)
        if plain and not skip and node.tag:
            text = ''.join(node.children).strip()
            if text:
                self.messages.add(text)
                attrs['data-i18n'] = text
        content=[]
        for child in node.children:
            if not isinstance(child,str):
                content.append(self.render(child, skip))
            elif skip:
                content.append(child)
            elif child.strip() and not plain:
                source=child.strip()
                self.messages.add(source)
                content.append('<span data-i18n="'+escape(source,quote=True)+'">'+escape(child)+'</span>')
            else:
                content.append(escape(child))
        if not node.tag:
            return ''.join(content)
        opening='<'+node.tag+''.join(' '+key+('="'+escape(str(value),quote=True)+'"' if value is not None else '') for key,value in attrs.items())+'>'
        return opening+''.join(content)+('' if node.tag in VOID else '</'+node.tag+'>')

def annotate(template):
    parser=Template()
    parser.feed(template)
    result='<!doctype html>\n'+parser.render()
    return result, parser.messages
