# jekyll-action-ts
A GitHub Action to build and publish Jekyll sites to GitHub Pages

Out-of-the-box Jekyll with GitHub Pages allows you to leverage a limited, white-listed, set of gems. Complex sites requiring custom ones or non white-listed ones (AsciiDoc for intstance) used to require a continuous integration build in order to pre-process the site.

## About this version
Originated from https://github.com/helaili/jekyll-action, however this has been converted from a Docker action to a typescript/js action to cut down on the Docker initialisation time, as well as to use https://github.com/ruby/setup-ruby to automatically select bundler version. 

V2 of this action removes the `git push` step from this action (basically only building the site and updating bundle dependencies), and instead uses https://github.com/peaceiris/actions-gh-pages for more flexibility (you can choose the committer, the repository, etc.). You can also choose to deploy to AWS, Google Cloud, Azure, or wherever else you wish to by removing the gh-pages action. (However I don't have any experience doing that, so you have to experiment at your own risk)

It is also able to cache the .jekyll-cache folder which may help with very large websites. 

## Official jekyll tutorial
V2 of this action completely differs from the official jekyll tutorial. However, I probably don't have time to write a full guide. 

If you prefer to follow the official [jekyll docs](https://jekyllrb.com/docs/continuous-integration/github-actions/) (or [here](https://deploy-preview-8119--jekyllrb.netlify.app/docs/continuous-integration/github-actions/) if that link does not work yet), just use this [sample workflow file](#use-the-action) rather than they one they provide

## Usage

### Create a Jekyll site
If you repo doesn't already have one, create a new Jekyll site:  `jekyll new sample-site`. See [the Jekyll website](https://jekyllrb.com/) for more information. In this repo, we have created a site within a `sample_site` folder within the repository because the repository's main goal is not to be a website. If it was the case, we would have created the site at the root of the repository.

### Create a `Gemfile`
As you are using this action to leverage specific Gems, well, you need to declare them! In the sample below we are using [the Jekyll AsciiDoc plugin](https://github.com/asciidoctor/jekyll-asciidoc)

```Ruby
source 'https://rubygems.org'

gem 'jekyll', '~> 3.8.5'
gem 'coderay', '~> 1.1.0'

group :jekyll_plugins do
  gem 'jekyll-asciidoc', '~> 2.1.1'
end

```

### Configure your Jekyll site
Edit the configuration file of your Jekyll site (`_config.yml`) to leverage these plugins. In our sample, we want to leverage AsciiDoc so we added the following section:

```yaml
asciidoc: {}
asciidoctor:
  base_dir: :docdir
  safe: unsafe
  attributes:
    - idseparator=_
    - source-highlighter=coderay
    - icons=font
```

Note that we also renamed `index.html` to `index.adoc` and modified this file accordingly in order to leverage AsciiDoc.

### Use the action
Put the `workflow.yml` file below into `.github/workflows`. It can be copied from [here](https://github.com/limjh16/jekyll-action-ts/blob/master/.github/workflows/workflow.yml) as well.

[`.github/workflows/workflow.yml`](https://github.com/limjh16/jekyll-action-ts/blob/master/.github/workflows/workflow.yml):
```yaml
name: Build and deploy jekyll site

on:
  push
    
jobs:
  jekyll:
    runs-on: ubuntu-16.04 # can change this to ubuntu-latest if you prefer
    steps:
    - uses: actions/checkout@v2
    - id: find
      name: Find jekyll directory # this step is needed to provide the cache directory and cache hash key
      run: |
        JEKYLL_SRC=$(find . -path ./vendor/bundle -prune -o -name _config.yml -exec dirname {} \; | tr -d '\n')
        JEKYLL_HASH=$(ls -alR --full-time ${JEKYLL_SRC} | sha1sum)
        echo "::set-output name=jekyllSrc::${JEKYLL_SRC}"
        echo "::set-output name=jekyllHash::${JEKYLL_HASH}"
    - name: Cache bundle files
      uses: actions/cache@v1
      with:
        path: vendor/bundle
        key: ts-${{ runner.os }}-gems-${{ hashFiles('**/Gemfile.lock') }}
        restore-keys: |
          ts-${{ runner.os }}-gems-
    - name: Cache jekyll files
      uses: actions/cache@v1
      with:
        path: ${{steps.find.outputs.jekyllSrc}}/.jekyll-cache
        key: ts-${{ runner.os }}-jekyll-${{steps.find.outputs.jekyllHash}}
        restore-keys: |
          ts-${{ runner.os }}-jekyll-
    - name: Set up Ruby 2.6
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: 2.6 # can change this to 2.7 or whatever version you prefer
    - name: Build jekyll site
      uses: limjh16/jekyll-action-ts@v2
      with:
        jekyll_src: ${{steps.find.outputs.jekyllSrc}}
    - name: Deploy
      if: github.event_name == 'push'
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./_site
        # if the repo you are deploying to is <username>.github.io, uncomment the line below.
        # if you are including the line below, make sure your source files are NOT in the master branch
        #publish_branch: master
```

Upon successful execution, the GitHub Pages publishing will happen automatically and will be listed on the *_environment_* tab of your repository. 

![image](https://user-images.githubusercontent.com/2787414/51083469-31e29700-171b-11e9-8f10-8c02dd485f83.png)

Just click on the *_View deployment_* button of the `github-pages` environment to navigate to your GitHub Pages site.

![image](https://user-images.githubusercontent.com/2787414/51083411-188d1b00-171a-11e9-9a25-f8b06f33053e.png)
