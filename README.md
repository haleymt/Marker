# Marker

A simple Markdown to HTML converter.

## Supported styles

__Inline styles__

\* emphasis \* and \_ emphasis \_

`<em>emphasis</em>`

*emphasis*

\*\* strong \*\* and \_\_ strong \_\_

`<strong>strong</strong>`

**strong**

\` code \`

`<code>code</code>`

`code`


__Links__

\[ this links to google \]\(google.com "A Title"\)

`<a href="http://google.com" title="A Title">this links to google</a>`

[ this links to google ](google.com "A Title")


__HR__

\* \* \*
\- \- \-
\*\*\*
\-\-\-

`<hr>`

-----


__Paragraphs__

Two new lines will create a new paragraph. One will create a `<br>`:

This is my first paragraph of text.
This is the paragraph's second line.

This is the second paragraph.
This is the second paragraph's second line.

```
<p>
This is my first paragraph of text.<br>
This is the paragraph's second line.
</p>
<p>
This is the second paragraph.<br>
This is the second paragraph's second line.
</p>
```


__Code blocks__

\`\`\`
This is some fake code
\`\`\`

```
<pre><code>
This is some fake code
</code></pre>
```

```
This is some fake code

```


__Headers__

\# H1 or H1
         \-\-\-

`<h1>H1</h1>`

# H1

\#\# H2 or H2
         \=\=\=

`<h2>H2</h2>`

# H2

\#\#\# H3

`<h3>H3</h3>`

### H3

\#\#\#\# H4

`<h4>H4</h4>`

#### H4

\#\#\#\#\# H5

`<h5>H5</h5>`

##### H5

\#\#\#\#\#\# H6

`<h6>H6</h6>`

###### H6


__Lists__

unordered lists:
\* one
\* two
\* three

```
<ul>
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ul>
```

* one
* two
* three

ordered lists:
1\. one
2\. two
3\. three

```
<ol>
  <li>one</li>
  <li>two</li>
  <li>three</li>
</ol>
```

1. one
2. two
3. three

task lists:
-\[] not done
-\[X] done
-\[] not done

```
<ul class="task-list">
  <li><input type="checkbox" disabled />not done</li>
  <li><input type="checkbox" disabled checked />done</li>
  <li><input type="checkbox" disabled />not done</li>
</ul>
```

-[] not done
-[X] done
-[] not done
