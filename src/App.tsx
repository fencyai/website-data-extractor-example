import { useStructuredChatCompletions, useWebsites } from '@fencyai/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Loader, TextInput } from '@mantine/core'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const linkSchema = z.object({
    link: z.string().min(1).url(),
})

const formSchema = z.object({
    companyName: z.string(),
    companyOrganizationNumber: z.string(),
    companyFullAddress: z.string(),
})

type ExampleState =
    | 'waiting_for_url'
    | 'getting_website_content'
    | 'getting_suggestions'
    | 'suggestions_received'
    | 'filling_form_error'

export default function App() {
    const [suggestions, setSuggestions] = useState<z.infer<
        typeof formSchema
    > | null>(null)
    const [formsState, setFormsState] =
        useState<ExampleState>('waiting_for_url')
    const { createWebsite } = useWebsites({
        async onTextContentReady(event) {
            setFormsState('getting_suggestions')
            console.log(event.textContent)
            const companyFormResponse =
                await chatCompletions.createStructuredChatCompletion({
                    responseFormat: formSchema,
                    gemini: {
                        messages: [
                            {
                                role: 'user',
                                content:
                                    'Find suggestions for the following form based on this content. Make sure to include all the relevant datapoints you can find ' +
                                    event.textContent,
                            },
                        ],
                        model: 'gemini-2.5-flash-lite-preview-06-17',
                    },
                })
            if (companyFormResponse.type === 'success') {
                setSuggestions(companyFormResponse.data.structuredResponse)
                setFormsState('suggestions_received')
            } else {
                setFormsState('filling_form_error')
            }
        },
    })
    const chatCompletions = useStructuredChatCompletions()
    const [formSubmitted, setFormSubmitted] = useState(false)

    const companyFormData = useForm({
        resolver: zodResolver(formSchema),
    })
    const linkForm = useForm({
        resolver: zodResolver(linkSchema),
        defaultValues: {
            link: 'https://www.allabolag.se/foretag/spotify-ab/stockholm/datacenters/5567037485',
        },
    })

    const submitForm = async (values: z.infer<typeof linkSchema>) => {
        setFormsState('getting_website_content')
        await createWebsite({
            url: values.link,
        })
    }

    const isLoading =
        formsState !== 'waiting_for_url' &&
        formsState !== 'suggestions_received'

    return (
        <div className="w-screen h-screen bg-gray-100 pt-10">
            <div className="flex flex-col gap-2 mb-2 max-w-2xl mx-auto bg-white p-4 rounded-lg">
                <form onSubmit={linkForm.handleSubmit(submitForm)}>
                    <TextInput
                        label="Link"
                        {...linkForm.register('link')}
                        error={linkForm.formState.errors.link?.message}
                    />
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            leftSection={
                                isLoading ? <Loader size="xs" /> : undefined
                            }
                            disabled={isLoading}
                        >
                            {getStateMeta(formsState).title}
                        </Button>
                    </div>
                </form>
                <form
                    onSubmit={companyFormData.handleSubmit(() => {
                        setFormSubmitted(true)
                    })}
                >
                    <TextInput
                        label="Company Name"
                        {...companyFormData.register('companyName')}
                        error={
                            companyFormData.formState.errors.companyName
                                ?.message
                        }
                    />
                    <Suggestions
                        suggestions={
                            suggestions?.companyName
                                ? [suggestions.companyName]
                                : []
                        }
                        onClick={(companyName) =>
                            companyFormData.setValue('companyName', companyName)
                        }
                    />
                    <TextInput
                        label="Company Organization Number"
                        {...companyFormData.register(
                            'companyOrganizationNumber'
                        )}
                        error={
                            companyFormData.formState.errors
                                .companyOrganizationNumber?.message
                        }
                    />
                    <Suggestions
                        suggestions={
                            suggestions?.companyOrganizationNumber
                                ? [suggestions.companyOrganizationNumber]
                                : []
                        }
                        onClick={(companyOrganizationNumber) =>
                            companyFormData.setValue(
                                'companyOrganizationNumber',
                                companyOrganizationNumber
                            )
                        }
                    />
                    <TextInput
                        label="Company Full Address"
                        {...companyFormData.register('companyFullAddress')}
                        error={
                            companyFormData.formState.errors.companyFullAddress
                                ?.message
                        }
                    />
                    <Suggestions
                        suggestions={
                            suggestions?.companyFullAddress
                                ? [suggestions.companyFullAddress]
                                : []
                        }
                        onClick={(companyFullAddress) =>
                            companyFormData.setValue(
                                'companyFullAddress',
                                companyFullAddress
                            )
                        }
                    />
                </form>
                {formSubmitted && (
                    <Alert
                        variant="light"
                        color="teal"
                        title="Form submitted successfully"
                    >
                        Form submitted successfully.
                    </Alert>
                )}
            </div>
        </div>
    )
}

function Suggestions({
    suggestions,
    onClick,
}: {
    suggestions: string[]
    onClick: (suggestion: string) => void
}) {
    return (
        <div className="flex gap-1 mt-2">
            {suggestions.map((suggestion) => (
                <Suggestion
                    key={suggestion}
                    value={suggestion}
                    onClick={() => onClick(suggestion)}
                />
            ))}
        </div>
    )
}

function Suggestion({
    value,
    onClick,
}: {
    value: string
    onClick: () => void
}) {
    return (
        <Button
            color="grape"
            size="xs"
            radius={'lg'}
            className="h-2"
            onClick={onClick}
        >
            {value}
        </Button>
    )
}

const getStateMeta = (
    state: ExampleState
): {
    title: string
} => {
    switch (state) {
        case 'waiting_for_url':
            return {
                title: 'Get suggestions',
            }
        case 'getting_website_content':
            return {
                title: 'Getting website content...',
            }
        case 'getting_suggestions':
            return {
                title: 'Getting suggestions...',
            }
        case 'suggestions_received':
            return {
                title: 'Suggestions received!',
            }
        case 'filling_form_error':
            return {
                title: 'Error filling form!',
            }
    }
}
