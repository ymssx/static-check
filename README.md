A tool to help you scan the repeat static pictures.

## Usage

```
yarn add static-check --dev
```

you can add a command in `scripts` of file "package.json"

```
{
  "scripts": {
    "static:check": "yarn static-check --path=src/assets/"
  }
}
```

you can also add it to your `husky` config

```
{
  "husky": {
    "hooks": {
      "pre-commit": "yarn static:check"
    }
  }
}
```

## Params

-   path: string

your static files path，default is `src/assets/`

```
{
  "scripts": {
    "static:check": "yarn static-check --path=src/assets/"
  }
}
```

\


-   size: number

-   distance: number

-   threshold: number


```
{
  "scripts": {
    "static:check": "yarn static-check -size 10"
  }
}

```

-   all: boolean

if scan the entire folder, or only check the staged files. default is `false`

```
{
  "scripts": {
    "static:check:all": "yarn static-check --all --path=src/assets/"
  }
}
```


-   limitSize: boolean

if turn on the file size limit. default is `false`

-   maxSize: number

when turn on the file size limit, the allowed maxminium file size. default is `150`, the unit is `KB`

```
{
  "scripts": {
    "static:check": "yarn static-check --limitSize --maxSize=150"
  }
}
```
