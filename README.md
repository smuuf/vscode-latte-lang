<p align="center">
<img src="https://raw.githubusercontent.com/smuuf/vscode-latte-lang/master/resources/logo.png" width="100">
</p>

<h1 align="center">Nette Latte extension for VS Code ☕</h1>

<p align="center">
VS Code extension for <a href="https://latte.nette.org/">Nette Latte</a> template files.
</p>
<p align="center">
<a href="https://marketplace.visualstudio.com/items?itemName=smuuf.latte-lang">
    <img alt="VS Code Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/smuuf.latte-lang"></a>
<a href="https://marketplace.visualstudio.com/items?itemName=smuuf.latte-lang">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/smuuf.latte-lang"></a>
</p>

## Installation
Open and install via VS Code Marketplace: [Nette Latte templates](https://marketplace.visualstudio.com/items?itemName=smuuf.latte-lang).

## Provides
- **Syntax highlight** in Latte files.
- **Goto variable definitions** for variables defined in Latte files.
- **Goto class definition** of typed variables in Latte files.
- **Goto method definition** of methods called on typed variables in Latte files.
- **Goto files** used in `{include ...}`, `{layout ...}`, `{sandbox ...}`, `{extends ...}` tags.
- **Hover information** containing type of variables in Latte files.
- **Hover information** containing return type of method calls in Latte files.
- **Type inference** of values coming from known method calls with known return types.
- **Type resolution** of basic iterables.
  - For example for `{foreach $a as $b}` where `$a` is of type `array<MyType>` we will know `$b` is of type `MyType`.
- **Autocomplete** support for `$variables` and `$object->methodName()` in Latte files.

### Types
The excentions supports resolving generic types for these basic iterable types:
- `array<V>`
- `iterable<V>`
- `\Iterator<V>`
- `\IteratorAggregate<V>`
- `\Traversable<V>`
- `\Generator<V>`
