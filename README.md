i

##  Verint Calendar Bookmarklet

Insert the following code into a bookmark. MAKE SURE that you replace `<URL>`  with the URL of your company; like company.org.au

```
javascript:(async () => { eval(`let URL='https://service.<URL>'; ` + (await (await fetch(`https://raw.githubusercontent.com/tfpk/verint-calendar-bookmarklet/main/script.js?rand=${Math.random().toString(36)}`)).text()))})();
```

