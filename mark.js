/* CONSTANTS */

const nodeTypes = {
  '*': 'em',
  '_': 'em',
  '**': 'strong',
  '__': 'strong',
};

/* UTILITIES */

function escapeHTML(text) {
  return text
      // .replace(/"/g, '&quot;')
      // .replace(/'/g, '&apos;')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}

function isTaskListLine(line) {
  return line[0] === '-' && line[1] === '[' && (line[2] === ']' || (line[2] === 'X' && line[3] === ']'));
}

/* GET FUNCTIONS
  these get the node content to be converted to HTML
*/

function getLink(text) {
  if (text[0] !== '[') return false;

  const titleIndex = text.indexOf('](');

  if (titleIndex < 0) return false;

  let linkIndex = text.slice(titleIndex).indexOf(')');

  if (linkIndex < 0) return false;

  if (text[linkIndex + titleIndex + 1] === ')')
    linkIndex += 1;

  const content = text.slice(1, titleIndex).trim();
  let link = text.slice(titleIndex + 2, linkIndex + titleIndex).trim();
  const linkWords = link.split(' "');
  const title = linkWords[linkWords.length - 1] || link;

  if (link.slice(0, 4) !== 'http')
    link = 'http://' + link;

  return { title, link, content, offset: linkIndex + titleIndex };
}

function getLeadingSpaces(string) {
  const spaces = string.match(/^\s+/);
  return spaces ? spaces[0].length : 0;
}

function getLastValidListIndex(nodes) {
  let lastValidIndex = 0;
  const taskList = isTaskListLine(nodes[0]);

  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i + 1]) {
      return lastValidIndex;
    }

    const node = nodes[i];

    if (taskList) {
      if (isTaskListLine(nodes[i + 1])) {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }

    const leadingSpaces = getLeadingSpaces(node);
    const nextLeadingSpaces = getLeadingSpaces(nodes[i + 1]);

    const asteriskIndex = node.indexOf('*');
    const periodIndex = node.indexOf('.');

    const nextAsteriskIndex = nodes[i + 1].indexOf('*');
    const nextPeriodIndex = nodes[i + 1].indexOf('.');

    const firstChar = asteriskIndex === leadingSpaces ? '*' : periodIndex ? parseInt(node.slice(leadingSpaces, periodIndex), 10) : undefined;
    const nextFirstChar = nextAsteriskIndex === nextLeadingSpaces ? '*' : nextPeriodIndex ? parseInt(nodes[i + 1].slice(nextLeadingSpaces, nextPeriodIndex), 10) : undefined;

    if (!firstChar || (firstChar !== '*' && isNaN(firstChar))) {
      return lastValidIndex;
    }

    if (leadingSpaces === nextLeadingSpaces) {
      if ((firstChar === '*' && nextFirstChar === '*') || (nextFirstChar === firstChar + 1)) {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }

    if (leadingSpaces < nextLeadingSpaces) {
      if (nextLeadingSpaces === leadingSpaces + 2 && (nextFirstChar === '*' || nextFirstChar === 1)) {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }

    if (leadingSpaces > nextLeadingSpaces) {
      const lastIndex = _.findLastIndex(nodes.slice(0, i), (n) => getLeadingSpaces(n) === nextLeadingSpaces); // eslint-disable-line

      if (lastIndex === -1) {
        return lastValidIndex;
      }

      if (nextFirstChar === '*' && nodes[lastIndex][nextLeadingSpaces] === '*') {
        lastValidIndex += 1;
      } else if (nextFirstChar - 1 === parseInt(nodes[lastIndex].slice(nextLeadingSpaces, nodes[lastIndex].indexOf('.')), 10)) {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }
  }

  return lastValidIndex;
}

function getNodeType(nodes) {
  const line = nodes[0];
  const nextLine = nodes[1];
  const listType = getListType(nodes); // eslint-disable-line
  let lastIndex = 0;
  console.log(line);

  if (line === '') {
    return { type: 'p' };
  } else if (listType) {
    return listType;
  } else if (line.slice(0, 7) === '###### ') {
    return { type: 'h6', slice: 7, lastIndex };
  } else if (line.slice(0, 6) === '##### ') {
    return { type: 'h5', slice: 6, lastIndex };
  } else if (line.slice(0, 5) === '#### ') {
    return { type: 'h4', slice: 5, lastIndex };
  } else if (line.slice(0, 4) === '### ') {
    return { type: 'h3', slice: 4, lastIndex };
  }
  let h2, h1;
  if (nextLine) {
    const matches = nextLine.match(/(.)\1*/);
    console.log(matches);
    h2 = matches && nextLine[0] === '-' && matches[0] === nextLine;
    h1 = matches && nextLine[0] === '=' && matches[0] === nextLine;
  }

  if (line.slice(0, 3) === '## ' || h2) {
    if (h2) lastIndex += 1;
    return { type: 'h2', slice: 3, lastIndex };
  } else if (line.slice(0, 2) === '# ' || h1) {
    if (h1) lastIndex += 1;
    return { type: 'h1', slice: 2, lastIndex };
  } else if (line[0] === '-' && line[1] === '[' && (line[2] === ']' || (line[2] === 'X' && line[3] === ']'))) {
    return { type: 'checklist', checked: line[2] === ']' };
  } else if (line[0] === '>') {
    return { type: 'blockquote' };
  } else if (line.slice(0, 3) === '```' && line.trim().length === 3 ) {
    lastIndex = _.findIndex(nodes.slice(1), (l) => l.slice(0, 3) === '```' && l.trim().length === 3);

    if (lastIndex > -1) return { type: 'codeblock', lastIndex };
  }

  return { type: 'none' };
}

function getLastValidIndex(nodes, type) {
  let lastValidIndex = 0;
  let startIndex = 0;

  if (nodes.length < 1) {
    return lastValidIndex;
  } else if (type === 'list') {
    return getLastValidListIndex(nodes);
  } else if (type === 'codeblock') {
    return _.findIndex(nodes.slice(1), (l) => l.slice(0, 3) === '```' && l.trim().length === 3);
  } else if (type === 'p') {
    if (nodes[0] === '') {
      lastValidIndex = 1;
      startIndex = 1;
    }

    for (let i = startIndex; i < nodes.length; i++) {
      if (getNodeType(nodes.slice(i)).type === 'none') {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }
  } else if (type === 'blockquote') {
    for (let j = 0; j < nodes.length; j++) {
      if (nodes[j][0] === '>') {
        lastValidIndex += 1;
      } else {
        return lastValidIndex;
      }
    }
  }

  return lastValidIndex;
}

function getListType(nodes) {
  const line = nodes[0];
  const taskList = isTaskListLine(line);
  const type = taskList || line[0] === '*' ? 'ul' : (line[0] === '1' && line[1] === '.') ? 'ol' : false;

  if (type) {
    const lastIndex = getLastValidIndex(nodes, 'list');

    if (lastIndex > 0 || taskList) {
      return { type, lastIndex, taskList };
    }
  }

  return false;
}

/* CONVERSION FUNCTIONS
  these return strings of HTML
*/

function convertEmphasis(line) {
  let converted = '';
  for (let i = 0; i < line.length; i++) {
    let char = escapeHTML(line[i]);
    let type = nodeTypes[char];

    if (type) {
      const currentString = line.slice(i + 1);
      let convertedText = char;
      let offset = 0;
      let lastIndex = currentString.indexOf(char);
      let strongEm = false;

      if (lastIndex === 0) {
        const strongIndex = currentString.slice(1).indexOf(char + char);

        if (strongIndex > -1) {
          char += char;
          type = 'strong';
          lastIndex = strongIndex;

          if (line[i + 2] === line[i] && currentString.slice(strongIndex + 2, strongIndex + 4) === char) {
            strongEm = true;
            char += line[i];
            lastIndex -= 1;
          }
        }
      }

      if (lastIndex > 0) {
        const innerText = line.slice(i + char.length, i + lastIndex + char.length);
        offset = type === 'strong' ? lastIndex + 3 : lastIndex + 1;
        convertedText = '<' + type + '>' + convertEmphasis(innerText) + '</' + type + '>';

        if (strongEm) {
          convertedText = '<em>' + convertedText + '</em>';
          offset += 2;
        }
      }

      converted += convertedText;
      i += offset;
    } else {
      converted += char;
    }
  }

  return converted;
}

function convertLineBreaks(text) {
  return text.replace(/[\n\r]/g, '<br>');
}

function convertLinks(text) {
  /*
    converts links not in markdown syntax to markdown syntax
    regex is from http://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
  */
  const regExp = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi;
  const words = text.split(' ');

  _.map(words, (word, idx) => {
    const matches = regExp.exec(word);
    if (matches && matches[0] === matches.input) {
      if (!words[idx - 1] || !words[idx + 1] ||
        !(words[idx + 1][0] === [')'] && words[idx - 1].slice(words[idx - 1].length - 2) === '](')
      ) {
        words[idx] = word.replace(word, '[' + word + '](' + word + ')');
      }
    }
  });

  return words.join(' ');
}

function convertInlineStyles(str) {
  const string = convertLinks(str);
  const codeIndexes = [];
  const nodes = [];

  /* converts nodes by order of priority
    1. <code>
    2. <a>
    3. <strong> and <em>
  */

  for (let i = 0; i < string.length; i++) {
    const link = getLink(string.slice(i));
    if (string[i] === '`' && !_.includes(codeIndexes, i)) {
      let endIndex = string.slice(i + 1).indexOf('`');
      if (endIndex > -1) {
        endIndex = endIndex + i + 1;
        codeIndexes.concat([i, endIndex]);
        nodes.push({ type: 'code', startIndex: i, endIndex });
      }
    } else if (link) {
      const lastNode = _.last(nodes);
      if (!lastNode || lastNode.type !== 'code' || lastNode.endIndex < i) {
        nodes.push({ type: 'link', link, startIndex: i, endIndex: link.offset + i });
      }
    }
  }

  if (nodes.length) {
    let converted = '';

    for (let j = 0; j < nodes.length; j++) {
      const node = nodes[j];
      const sliceStart = j === 0 ? 0 : nodes[j - 1].endIndex + 1;
      const sliceEnd = node.startIndex;

      converted += convertEmphasis(string.slice(sliceStart, sliceEnd));

      if (node.type === 'link') {
        converted += `<a href="${node.link.link}" target="_blank" title="${node.link.title}">${node.link.content}</a>`;
      } else {
        converted += '<code>' + escapeHTML(string.slice(sliceEnd + 1, node.endIndex)) + '</code>';
      }

      if (j === nodes.length - 1) {
        converted += convertEmphasis(string.slice(node.endIndex + 1, string.length));
      }
    }
    return converted;
  }

  return convertEmphasis(string);
}

function convertList(nodes, type) {
  let converted = '';

  if (type === 'ul' || type === 'ol') {
    converted += '<' + type;
    if (isTaskListLine(nodes[0])) {
      converted += ' class="task-list"';
    }

    converted += '>' + convertList(nodes, 'li') + '</' + type + '>';
  } else if (type === 'li') {
    for (let i = 0; i < nodes.length; i++) {
      let slice;
      const taskList = isTaskListLine(nodes[i]);

      if (taskList) {
        slice = nodes[i].indexOf(']') + 1;
      } else {
        const leadingSpaces = getLeadingSpaces(nodes[i]);
        slice = nodes[i][leadingSpaces] === '*' ? nodes[i].indexOf('*') + 1 : nodes[i].indexOf('.') + 1;
      }

      converted += '<li>';

      if (taskList) {
        converted += '<input type="checkbox"' + (slice === 3 ? '' : ' checked') + ' disabled />';
      }

      converted += convertInlineStyles(nodes[i].slice(slice));

      if (nodes[i + 1] && !taskList) {
        const nextLeadingSpaces = getLeadingSpaces(nodes[i + 1]);

        if (leadingSpaces < nextLeadingSpaces) {
          const listType = isNaN(parseInt(nodes[i + 1][nextLeadingSpaces], 10)) ? 'ul' : 'ol';
          let endIndex = _.findIndex(nodes.slice(i + 1), (n) => getLeadingSpaces(n) === leadingSpaces); // eslint-disable-line
          endIndex = endIndex > -1 ? endIndex + i + 1 : nodes.length;

          converted += convertList(nodes.slice(i + 1, endIndex), listType) + '</li>';
          i = endIndex - 1;
        }
      } else {
        converted += '</li>';
      }
    }
  }
  return converted;
}

function convertAll(html) {
  let converted = '';
  const lines = html.split('<br>');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const currentLines = lines.slice(i);
    const nodeType = getNodeType(currentLines);
    let children;
    let lastIndex;

    // is list
    if (nodeType.type === 'ol' || nodeType.type === 'ul') {
      converted += convertList(lines.slice(i, nodeType.lastIndex + i + 1), nodeType.type);
      i = nodeType.lastIndex + i;

      // is code block
    } else if (nodeType.type === 'codeblock') {
      lastIndex = nodeType.lastIndex + i + 1;
      children = _.map(lines.slice(i + 1, lastIndex), (l) => escapeHTML(l)); // eslint-disable-line

      converted += '<pre><code>' + children.join('<br>') + '</code></pre>';
      i = lastIndex;

      // is header
    } else if (nodeType.type === 'h1' || nodeType.type === 'h2' || nodeType.type === 'h3') {
      converted += '<' + nodeType.type + '>' + convertInlineStyles(line.slice(nodeType.slice)) + '</' + nodeType.type + '>';
      i += nodeType.lastIndex;

      // is blockquote
    } else if (nodeType.type === 'blockquote') {
      lastIndex = getLastValidIndex(currentLines, 'blockquote') + i;

      children = _.map(lines.slice(i, lastIndex), (l) => l.slice(1)); // eslint-disable-line
      converted += '<blockquote><div class="blockquote-bar"></div>' + convertAll(children.join('<br>')) + '</blockquote>';
      i = lastIndex - 1;

      // is paragraph
    } else {
      lastIndex = getLastValidIndex(currentLines, 'p') + i;
      const startIndex = line === '' ? i + 1 : i;

      children = _.map(lines.slice(startIndex, lastIndex), (l) => convertInlineStyles(l)); // eslint-disable-line
      converted += '<p>' + children.join('<br>') + '</p>';

      i = lastIndex - 1;
    }
  }
  return converted;
}

function mark(value) {
  return convertAll(convertLineBreaks(value));
}

function Marker($main) {
  this.$doc = $main;
  this.registerEvents();
}

$.extend(Marker.prototype, {
  registerEvents: function() {
    var _this = this;
    $('#convert').click(function () {
      _this.convertText();
    });

    $('#clear').click(function () {
      _this.clearAll();
    });
  },

  convertText: function () {
    var text = $('#text').val();
    if (text.trim() !== '') {
      text = mark(text);
      $('#converted').html(text);
    }
  },

  clearAll: function () {
    $('#converted').html('<em class="placeholder">Your text will appear here</em>');
    $('#text').val('');
  }
});

$(function () {
  var $main = $('#main');
  v = new Marker($main);
});
