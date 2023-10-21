# (Nette) Latte extension for VS Code ☕

VS Code extension for (Nette) [Latte files](https://latte.nette.org/).

## Provides
- **Syntax highlight** in Latte files.
- **Goto variable definitions** for variables defined in Latte files.
- **Goto class definition** of typed variables in Latte files.
- **Hover information** for specified types of variables in Latte files.
- **Type resolution** of basic iterables
  - For example for `{foreach $a as $b}` where `$a` is of type `array<MyType>` we will know `$b` is of type `MyType`.
- **Autocomplete** support for `$variables` and `$object->methodName()` in Latte files.

### Types
`vscode-latte-lang` has support for resolving generic types for these basic iterable types:
- `array<V>`
- `iterable<V>`
- `\Iterator<V>`
- `\IteratorAggregate<V>`
- `\Traversable<V>`
- `\Generator<V>`
