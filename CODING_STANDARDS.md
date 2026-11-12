# Coding standards

## Test doubles

A double stays when `dispose`, a constructor, or an imported package calls it. Trace those calls before reporting the double unused.

## Source scans

A source scan shows a send is guarded when the return sits on the path from the last await to that send.
