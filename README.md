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
  - ![obrazek](https://github.com/smuuf/vscode-latte-lang/assets/6860713/0dadd251-77b7-4cd5-8f8d-e67f371f1aad)
- **Goto method definition** of methods called on typed variables in Latte files.
- **Goto files** used in `{include ...}`, `{layout ...}`, `{sandbox ...}`, `{extends ...}` tags.
- **Hover information** containing type of variables in Latte files.
- **Hover information** containing return type of method calls in Latte files.
  - ![obrazek](https://github.com/smuuf/vscode-latte-lang/assets/6860713/4b9e4f2d-7a75-4580-a0ae-e1a69b0f8361)
- **Type inference** of values coming from known method calls with known return types.
  - ![obrazek](https://github.com/smuuf/vscode-latte-lang/assets/6860713/2ad84aea-9956-4c8b-89db-dd0ef94af278)
- **Type resolution** of basic iterables.
  - For example for `{foreach $a as $b}` where `$a` is of type `array<MyType>` we will know `$b` is of type `MyType`.
  - ![obrazek](https://github.com/smuuf/vscode-latte-lang/assets/6860713/e717a1a1-c4d1-43e6-b847-de412b29fc1e)
- **Autocomplete** support for `$variables` and `$object->methodName()` in Latte files.
  - ![obrazek](https://github.com/smuuf/vscode-latte-lang/assets/6860713/180426ce-3150-4aa9-94a8-35b5c6530d78)

### Types
The excentions supports resolving generic types for these basic iterable types:
- `array<V>`
- `iterable<V>`
- `\Iterator<V>`
- `\IteratorAggregate<V>`
- `\Traversable<V>`
- `\Generator<V>`
