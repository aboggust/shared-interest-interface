from setuptools import setup, find_packages

requires = []

setup(
    name="SaliencyIOU",
    description="",
    package_dir={"":"backend"},
    packages=find_packages("backend"),
    license="Apache",
    author="Angie Boggust",
    include_package_data=True,
    install_requires=requires
)
